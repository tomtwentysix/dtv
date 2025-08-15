#!/bin/bash

# DT Visuals Setup Verification Script
# Run this script to verify your installation is correct

set -e

echo "🔍 DT Visuals Setup Verification"
echo "=================================="

# Check Node.js
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js: $NODE_VERSION"
else
    echo "❌ Node.js not found"
    exit 1
fi

# Check NPM
if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    echo "✅ NPM: $NPM_VERSION"
else
    echo "❌ NPM not found"
    exit 1
fi

# Check PostgreSQL
if command -v psql >/dev/null 2>&1; then
    PG_VERSION=$(psql --version | grep -oP '\d+\.\d+' | head -1)
    echo "✅ PostgreSQL: $PG_VERSION"
else
    echo "❌ PostgreSQL not found"
    exit 1
fi

# Check PostgreSQL service
if systemctl is-active postgresql >/dev/null 2>&1; then
    echo "✅ PostgreSQL service: Running"
else
    echo "⚠️  PostgreSQL service: Not running"
fi

# Check PM2
if command -v pm2 >/dev/null 2>&1; then
    PM2_VERSION=$(pm2 --version)
    echo "✅ PM2: $PM2_VERSION"
else
    echo "❌ PM2 not found"
    exit 1
fi

# Check Nginx
if command -v nginx >/dev/null 2>&1; then
    NGINX_VERSION=$(nginx -v 2>&1 | grep -o 'nginx/[0-9.]*')
    echo "✅ Nginx: $NGINX_VERSION"
else
    echo "❌ Nginx not found"
    exit 1
fi

# Check directories
echo ""
echo "📁 Directory Structure:"
if [[ -d "/var/www/dtvisuals" ]]; then
    echo "✅ /var/www/dtvisuals exists"
    
    if [[ -d "/var/www/dtvisuals/app" ]]; then
        echo "✅ /var/www/dtvisuals/app exists"
    else
        echo "⚠️  /var/www/dtvisuals/app missing (clone your repo here)"
    fi
    
    if [[ -d "/var/www/dtvisuals/uploads/prod" ]]; then
        echo "✅ /var/www/dtvisuals/uploads/prod exists"
    else
        echo "❌ /var/www/dtvisuals/uploads/prod missing"
    fi
    
    if [[ -d "/var/www/dtvisuals/uploads/dev" ]]; then
        echo "✅ /var/www/dtvisuals/uploads/dev exists"
    else
        echo "❌ /var/www/dtvisuals/uploads/dev missing"
    fi
else
    echo "❌ /var/www/dtvisuals doesn't exist"
fi

# Check database
echo ""
echo "💾 Database Check:"
if [[ -f "/tmp/dtvisuals_db_password.txt" ]]; then
    echo "✅ Database password file exists"
    DB_PASSWORD=$(cat /tmp/dtvisuals_db_password.txt)
else
    echo "⚠️  Database password file not found at /tmp/dtvisuals_db_password.txt"
    DB_PASSWORD=""
fi

# Test database connections
if [[ -n "$DB_PASSWORD" ]]; then
    if sudo -u dtvisuals psql -U dtvisuals -d dtvisuals_prod -h localhost -c "SELECT 1;" >/dev/null 2>&1; then
        echo "✅ Production database connection: SUCCESS"
    else
        echo "❌ Production database connection: FAILED"
    fi
    
    if sudo -u dtvisuals psql -U dtvisuals -d dtvisuals_dev -h localhost -c "SELECT 1;" >/dev/null 2>&1; then
        echo "✅ Development database connection: SUCCESS"
    else
        echo "❌ Development database connection: FAILED"
    fi
else
    echo "⚠️  Skipping database connection tests (no password file)"
fi

# Check environment files
echo ""
echo "⚙️  Environment Files:"
if [[ -d "/var/www/dtvisuals/app" ]]; then
    cd /var/www/dtvisuals/app
    
    if [[ -f ".env.prod" ]]; then
        echo "✅ .env.prod exists"
    else
        echo "⚠️  .env.prod missing"
    fi
    
    if [[ -f ".env.dev" ]]; then
        echo "✅ .env.dev exists"
    else
        echo "⚠️  .env.dev missing"
    fi
    
    if [[ -f ".env.prod.template" ]]; then
        echo "✅ .env.prod.template exists"
    else
        echo "❌ .env.prod.template missing"
    fi
    
    if [[ -f ".env.dev.template" ]]; then
        echo "✅ .env.dev.template exists"
    else
        echo "❌ .env.dev.template missing"
    fi
fi

# Check permissions
echo ""
echo "🔐 Permissions Check:"
if [[ -d "/var/www/dtvisuals" ]]; then
    OWNER=$(stat -c '%U:%G' /var/www/dtvisuals)
    if [[ "$OWNER" == "dtvisuals:www-data" ]]; then
        echo "✅ /var/www/dtvisuals ownership: $OWNER"
    else
        echo "⚠️  /var/www/dtvisuals ownership: $OWNER (expected: dtvisuals:www-data)"
    fi
    
    if [[ -d "/var/www/dtvisuals/uploads/prod" ]]; then
        UPLOAD_OWNER=$(stat -c '%U:%G' /var/www/dtvisuals/uploads/prod)
        if [[ "$UPLOAD_OWNER" == "dtvisuals:www-data" ]]; then
            echo "✅ Upload directories ownership: $UPLOAD_OWNER"
        else
            echo "⚠️  Upload directories ownership: $UPLOAD_OWNER (expected: dtvisuals:www-data)"
        fi
    fi
fi

echo ""
echo "🏁 Verification Complete!"
echo ""
echo "Next steps if verification passed:"
echo "1. Clone your repository to /var/www/dtvisuals/app"
echo "2. Create and configure .env.prod and .env.dev files"
echo "3. Run: sudo ./deploy.sh prod main"
echo ""
echo "If you see any ❌ or ⚠️  above, refer to the DEPLOYMENT_GUIDE.md for troubleshooting."