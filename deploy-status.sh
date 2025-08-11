#!/bin/bash

# DT Visuals Deployment Status Checker
# Run this to check the current status of your deployment

echo "=== DT Visuals Deployment Status ==="
echo ""

# Check if we're on the server
if [[ ! -d "/var/www/dtvisuals" ]]; then
    echo "❌ Not on server - /var/www/dtvisuals directory not found"
    echo "Run this script on your deployment server"
    exit 1
fi

# System Services Status
echo "🖥️  System Services:"
echo "   PostgreSQL: $(systemctl is-active postgresql)"
echo "   Nginx: $(systemctl is-active nginx)"
echo ""

# PM2 Applications
echo "📱 PM2 Applications:"
if command -v pm2 >/dev/null 2>&1; then
    sudo -u dtvisuals pm2 jlist 2>/dev/null | jq -r '.[] | "   \(.name): \(.pm2_env.status) (uptime: \(.pm2_env.pm_uptime | if . then (now - (./1000) | floor) else 0 end)s)"' 2>/dev/null || {
        echo "   PM2 status check failed, trying basic list:"
        sudo -u dtvisuals pm2 list 2>/dev/null | grep -E "(dtvisuals|online|stopped|errored)" || echo "   No PM2 processes found"
    }
else
    echo "   PM2 not installed"
fi
echo ""

# Application Health
echo "🏥 Application Health:"
if curl -f -s http://localhost:5001/api/health >/dev/null 2>&1; then
    echo "   Production (port 5001): ✅ Healthy"
else
    echo "   Production (port 5001): ❌ Not responding"
fi

if curl -f -s http://localhost:5002/api/health >/dev/null 2>&1; then
    echo "   Development (port 5002): ✅ Healthy"
else
    echo "   Development (port 5002): ❌ Not responding"
fi
echo ""

# HTTPS Status
echo "🔒 HTTPS Status:"
if curl -f -s -I https://dtvisuals.com >/dev/null 2>&1; then
    echo "   https://dtvisuals.com: ✅ Working"
else
    echo "   https://dtvisuals.com: ❌ Not accessible"
fi

if curl -f -s -I https://dev.dtvisuals.com >/dev/null 2>&1; then
    echo "   https://dev.dtvisuals.com: ✅ Working"
else
    echo "   https://dev.dtvisuals.com: ❌ Not accessible"
fi
echo ""

# SSL Certificates
echo "📜 SSL Certificates:"
if command -v certbot >/dev/null 2>&1; then
    CERT_STATUS=$(sudo certbot certificates 2>/dev/null | grep -A 2 "dtvisuals.com" | grep "Expiry Date" | head -1)
    if [[ -n "$CERT_STATUS" ]]; then
        echo "   $CERT_STATUS"
    else
        echo "   No certificates found"
    fi
else
    echo "   Certbot not installed"
fi
echo ""

# Database Status  
echo "🗄️  Database Status:"
if sudo -u postgres psql -l 2>/dev/null | grep -q dtvisuals_prod; then
    echo "   dtvisuals_prod: ✅ Exists"
else
    echo "   dtvisuals_prod: ❌ Missing"
fi

if sudo -u postgres psql -l 2>/dev/null | grep -q dtvisuals_dev; then
    echo "   dtvisuals_dev: ✅ Exists"
else
    echo "   dtvisuals_dev: ❌ Missing"
fi
echo ""

# Recent Logs (last 10 lines from each service)
echo "📊 Recent Activity:"

echo "   Production app (last 5 lines):"
sudo -u dtvisuals pm2 logs dtvisuals-prod --lines 5 --nostream 2>/dev/null | tail -5 | sed 's/^/     /' || echo "     No logs available"

echo "   Development app (last 5 lines):"
sudo -u dtvisuals pm2 logs dtvisuals-dev --lines 5 --nostream 2>/dev/null | tail -5 | sed 's/^/     /' || echo "     No logs available"

echo ""

# Disk Usage
echo "💾 Disk Usage:"
echo "   /var/www/dtvisuals: $(du -sh /var/www/dtvisuals 2>/dev/null | cut -f1 || echo 'Unknown')"
echo "   Database size:"
sudo -u postgres psql -c "SELECT pg_database.datname, pg_size_pretty(pg_database_size(pg_database.datname)) AS size FROM pg_database WHERE datname LIKE 'dtvisuals%';" 2>/dev/null | grep dtvisuals | sed 's/^/     /' || echo "     Unable to check database size"
echo ""

# Environment Files
echo "⚙️  Environment Configuration:"
if [[ -f "/var/www/dtvisuals/app/.env.prod" ]]; then
    echo "   .env.prod: ✅ Exists"
else
    echo "   .env.prod: ❌ Missing"
fi

if [[ -f "/var/www/dtvisuals/app/.env.dev" ]]; then
    echo "   .env.dev: ✅ Exists" 
else
    echo "   .env.dev: ❌ Missing"
fi
echo ""

# Quick Actions
echo "🔧 Quick Actions:"
echo "   Check detailed logs: sudo -u dtvisuals pm2 logs"
echo "   Restart production: sudo -u dtvisuals pm2 restart dtvisuals-prod"
echo "   Restart development: sudo -u dtvisuals pm2 restart dtvisuals-dev" 
echo "   Deploy production: sudo ./deploy.sh prod main"
echo "   Deploy development: sudo ./deploy.sh dev dev"
echo "   SSL renewal: sudo certbot renew"
echo ""

echo "✅ Status check complete!"