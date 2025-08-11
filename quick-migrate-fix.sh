#!/bin/bash

# Quick fix for the database migration error
# Run this on the server to properly migrate both databases

echo "=== DT Visuals Database Migration Fix ==="

cd /var/www/dtvisuals/app

echo "📦 Installing dependencies..."
sudo -u dtvisuals npm ci --production

echo "🔨 Building application..."
sudo -u dtvisuals npm run build

echo "🗃️  Running database migrations for PRODUCTION..."
sudo -u dtvisuals NODE_ENV=production npx drizzle-kit migrate

echo "🗃️  Running database migrations for DEVELOPMENT..."
sudo -u dtvisuals NODE_ENV=development npx drizzle-kit migrate

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