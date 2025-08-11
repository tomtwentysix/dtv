#!/bin/bash

# Quick fix for the database migration error
# Run this on the server to properly migrate both databases

echo "=== DT Visuals Database Migration Fix ==="

cd /var/www/dtvisuals/app

echo "📦 Installing dependencies..."
sudo -u dtvisuals npm ci --production

echo "🔨 Building application..."
sudo -u dtvisuals npm run build

echo "🗃️  Setting up environment files..."
sudo ./setup-env-server.sh

echo ""
echo "⚠️  CRITICAL: You must configure environment files before migrations will work!"
echo "   1. Edit database password: sudo -u dtvisuals nano .env.prod"
echo "   2. Edit database password: sudo -u dtvisuals nano .env.dev"
echo "   3. Generate session secrets: openssl rand -hex 64"
echo ""
echo "🗃️  After configuring, run migrations:"
echo "   sudo -u dtvisuals ./run-migration-with-env.sh prod"
echo "   sudo -u dtvisuals ./run-migration-with-env.sh dev"

echo "🔄 Restarting PM2 processes..."
sudo -u dtvisuals pm2 restart all || {
    echo "Starting PM2 processes for the first time..."
    sudo -u dtvisuals pm2 start ecosystem.config.js
}

echo "📊 PM2 Status:"
sudo -u dtvisuals pm2 list

echo "✅ Migration fix completed!"
echo ""
echo "🌐 Test the applications:"
echo "   Production: curl -I http://localhost:5001/api/health"
echo "   Development: curl -I http://localhost:5002/api/health"