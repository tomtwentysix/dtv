#!/bin/bash

# DT Visuals Manual Deployment Script
# Usage: ./deploy.sh [prod|dev] [branch]

set -e

ENVIRONMENT=${1:-prod}
BRANCH=${2:-main}

if [[ "$ENVIRONMENT" != "prod" && "$ENVIRONMENT" != "dev" ]]; then
    echo "Usage: ./deploy.sh [prod|dev] [branch]"
    echo "Example: ./deploy.sh prod main"
    echo "Example: ./deploy.sh dev development"
    exit 1
fi

if [[ "$ENVIRONMENT" == "prod" ]]; then
    PM2_APP="dtvisuals-prod"
    PORT=5001
else
    PM2_APP="dtvisuals-dev"
    PORT=5002
fi

echo "=== DT Visuals Manual Deployment ==="
echo "Environment: $ENVIRONMENT"
echo "Branch: $BRANCH"
echo "PM2 App: $PM2_APP"
echo ""

# Check if we're in the correct directory
if [[ ! -f "package.json" ]]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if we're on the server
if [[ ! -d "/var/www/dtvisuals" ]]; then
    echo "❌ Error: This script should be run on the server with /var/www/dtvisuals directory."
    echo "For local development, use: npm run dev"
    exit 1
fi

# Create backup
echo "📦 Creating backup..."
sudo -u dtvisuals cp -r /var/www/dtvisuals/app /var/www/dtvisuals/app.backup.$(date +%Y%m%d-%H%M%S) 2>/dev/null || true

# Update code
echo "📥 Updating code..."
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production

# Build application
echo "🔨 Building application..."
npm run build

# Run database migrations
echo "🗃️  Running database migrations..."
if [[ "$ENVIRONMENT" == "prod" ]]; then
    NODE_ENV=production npm run db:migrate
else
    NODE_ENV=development npm run db:migrate
fi

# Restart application
echo "🔄 Restarting application..."
sudo -u dtvisuals pm2 restart $PM2_APP 2>/dev/null || {
    echo "PM2 app not found, starting new instance..."
    sudo -u dtvisuals pm2 start ecosystem.config.js --only $PM2_APP
}

# Wait for app to be ready
echo "⏳ Waiting for application to be ready..."
sleep 15

# Health check
echo "🏥 Performing health check..."
if curl -f http://localhost:$PORT/api/health > /dev/null 2>&1; then
    echo "✅ Application is healthy"
else
    echo "⚠️  Health check failed - check logs: pm2 logs $PM2_APP"
fi

# Show status
echo ""
echo "📊 Current Status:"
sudo -u dtvisuals pm2 list | grep dtvisuals || true

echo ""
echo "✅ Deployment completed!"
echo ""
echo "📋 Useful Commands:"
echo "   View logs: pm2 logs $PM2_APP"
echo "   Restart: pm2 restart $PM2_APP"
echo "   Stop: pm2 stop $PM2_APP"
echo "   Status: pm2 status"
echo ""
if [[ "$ENVIRONMENT" == "prod" ]]; then
    echo "🌐 Production URL: https://dtvisuals.com"
else
    echo "🌐 Development URL: https://dev.dtvisuals.com"
fi