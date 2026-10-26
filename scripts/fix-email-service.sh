#!/bin/bash

# Email Service Diagnostic and Fix Script for Production
# Run this script to diagnose and potentially fix email service issues

set -e

echo "🔧 DTV Email Service Diagnostic Tool"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

APP_DIR="/var/www/dtvisuals/app"
ENV_FILE="$APP_DIR/.env.prod"
PM2_APP="dtvisuals-prod"

echo -e "\n📋 Checking System Status..."

# Check if running as dtvisuals user or with proper permissions
if [ "$USER" = "dtvisuals" ]; then
    PM2_CMD="pm2"
elif [ "$EUID" -eq 0 ]; then
    PM2_CMD="sudo -u dtvisuals pm2"
else
    echo -e "${RED}❌ Error: Please run as dtvisuals user or with sudo${NC}"
    exit 1
fi

# 1. Check if PM2 app is running
echo -e "\n🔍 Checking PM2 Status..."
if $PM2_CMD list | grep -q "$PM2_APP"; then
    APP_STATUS=$($PM2_CMD list | grep "$PM2_APP" | awk '{print $10}')
    if [ "$APP_STATUS" = "online" ]; then
        echo -e "${GREEN}✅ PM2 app is running${NC}"
    else
        echo -e "${RED}❌ PM2 app is not online (status: $APP_STATUS)${NC}"
        echo "   Run: $PM2_CMD restart $PM2_APP"
    fi
else
    echo -e "${RED}❌ PM2 app '$PM2_APP' not found${NC}"
    exit 1
fi

# 2. Check if environment file exists
echo -e "\n🔍 Checking Environment File..."
if [ -f "$ENV_FILE" ]; then
    echo -e "${GREEN}✅ Environment file exists: $ENV_FILE${NC}"
    
    # Check SMTP configuration in env file
    echo -e "\n🔍 Checking SMTP Configuration in .env.prod..."
    SMTP_VARS=("SMTP_HOST" "SMTP_PORT" "SMTP_FROM" "SMTP_TO")
    ENV_OK=true
    
    for var in "${SMTP_VARS[@]}"; do
        if grep -q "^$var=" "$ENV_FILE"; then
            value=$(grep "^$var=" "$ENV_FILE" | cut -d'=' -f2)
            if [ -n "$value" ]; then
                echo -e "${GREEN}✅ $var is set${NC}"
            else
                echo -e "${RED}❌ $var is empty${NC}"
                ENV_OK=false
            fi
        else
            echo -e "${RED}❌ $var is missing${NC}"
            ENV_OK=false
        fi
    done
    
    if [ "$ENV_OK" = false ]; then
        echo -e "\n${YELLOW}⚠️  Some SMTP variables are missing or empty${NC}"
        echo "   Please check the .env.prod file configuration"
    fi
else
    echo -e "${RED}❌ Environment file not found: $ENV_FILE${NC}"
    echo "   Please copy .env.prod to the correct location"
    exit 1
fi

# 3. Check PM2 configuration
echo -e "\n🔍 Checking PM2 Configuration..."
PM2_CONFIG=$($PM2_CMD show "$PM2_APP" 2>/dev/null | grep -E "env_file|cwd" || true)
if echo "$PM2_CONFIG" | grep -q "env_file"; then
    echo -e "${GREEN}✅ PM2 env_file configuration found${NC}"
else
    echo -e "${YELLOW}⚠️  PM2 env_file configuration not visible${NC}"
fi

# 4. Test API endpoints if app is running
echo -e "\n🔍 Testing Email Service API..."
if curl -s -f http://localhost:5001/api/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ API is responding${NC}"
    
    # Get email debug info
    echo -e "\n📧 Email Service Status:"
    DEBUG_RESPONSE=$(curl -s http://localhost:5001/api/email/debug 2>/dev/null || echo "Failed to get debug info")
    
    if echo "$DEBUG_RESPONSE" | grep -q "SMTP_HOST"; then
        SMTP_HOST_STATUS=$(echo "$DEBUG_RESPONSE" | grep -o '"SMTP_HOST":"[^"]*"' | cut -d'"' -f4)
        if [ "$SMTP_HOST_STATUS" != "NOT SET" ]; then
            echo -e "${GREEN}✅ SMTP_HOST is loaded in application${NC}"
            echo -e "${GREEN}✅ Email service should be working${NC}"
        else
            echo -e "${RED}❌ SMTP_HOST is NOT SET in application${NC}"
            echo -e "${YELLOW}🔧 Attempting to fix...${NC}"
            
            # Try to reinitialize email service
            REINIT_RESPONSE=$(curl -s -X POST http://localhost:5001/api/email/reinitialize 2>/dev/null || echo "Failed")
            if echo "$REINIT_RESPONSE" | grep -q "reinitialized"; then
                echo -e "${GREEN}✅ Email service reinitialized${NC}"
                
                # Check again
                sleep 2
                DEBUG_RESPONSE2=$(curl -s http://localhost:5001/api/email/debug 2>/dev/null || echo "Failed")
                SMTP_HOST_STATUS2=$(echo "$DEBUG_RESPONSE2" | grep -o '"SMTP_HOST":"[^"]*"' | cut -d'"' -f4)
                if [ "$SMTP_HOST_STATUS2" != "NOT SET" ]; then
                    echo -e "${GREEN}✅ Fix successful - SMTP_HOST now loaded${NC}"
                else
                    echo -e "${RED}❌ Fix failed - still need to restart PM2${NC}"
                fi
            else
                echo -e "${RED}❌ Failed to reinitialize email service${NC}"
            fi
        fi
    else
        echo -e "${RED}❌ Could not get email service debug info${NC}"
    fi
else
    echo -e "${RED}❌ API is not responding${NC}"
    echo "   The application may not be running properly"
fi

# 5. Show recent logs
echo -e "\n📝 Recent Application Logs:"
echo "=============================="
$PM2_CMD logs "$PM2_APP" --lines 20 --nostream | tail -20

echo -e "\n🔧 Diagnostic Complete"
echo "======================"

# Recommendations
echo -e "\n💡 ${YELLOW}Recommendations:${NC}"

if $PM2_CMD list | grep "$PM2_APP" | grep -q "online"; then
    if curl -s -f http://localhost:5001/api/health >/dev/null 2>&1; then
        DEBUG_RESPONSE=$(curl -s http://localhost:5001/api/email/debug 2>/dev/null || echo "Failed")
        if echo "$DEBUG_RESPONSE" | grep -q '"SMTP_HOST":".*SET"'; then
            echo -e "${GREEN}✅ System appears to be working correctly${NC}"
            echo "   Test the contact form: curl -X POST http://localhost:5001/api/contact -H 'Content-Type: application/json' -d '{\"firstName\":\"Test\",\"lastName\":\"User\",\"email\":\"test@example.com\",\"projectType\":\"documentary\",\"message\":\"Test message\"}'"
        else
            echo -e "${YELLOW}1. Restart PM2 process: $PM2_CMD restart $PM2_APP${NC}"
            echo -e "${YELLOW}2. Wait 30 seconds and run this script again${NC}"
        fi
    else
        echo -e "${YELLOW}1. Check application logs: $PM2_CMD logs $PM2_APP${NC}"
        echo -e "${YELLOW}2. Restart PM2 process: $PM2_CMD restart $PM2_APP${NC}"
    fi
else
    echo -e "${YELLOW}1. Start PM2 process: $PM2_CMD start $PM2_APP${NC}"
fi

echo -e "\n📚 For detailed troubleshooting, see EMAIL_PRODUCTION_TROUBLESHOOTING.md"