#!/bin/bash
#
# DT Visuals Manual Deployment Script
# Usage: ./deploy.sh [prod|dev] [branch]
#

set -e

ENVIRONMENT=${1:-prod}
BRANCH=${2:-main}

if [[ "$ENVIRONMENT" != "prod" && "$ENVIRONMENT" != "dev" ]]; then
    echo "Usage: ./deploy.sh [prod|dev] [branch]"
    echo "Environment must be 'prod' or 'dev'"
    exit 1
fi

if [[ "$ENVIRONMENT" == "prod" ]]; then
    PM2_APP="dtvisuals-prod"
    ENV_FILE=".env.prod"
else
    PM2_APP="dtvisuals-dev" 
    ENV_FILE=".env.dev"
fi

echo "=== Deploying DT Visuals ($ENVIRONMENT) from branch '$BRANCH' ==="

# Check if environment file exists
if [[ ! -f "$ENV_FILE" ]]; then
    echo "❌ Environment file $ENV_FILE not found!"
    echo "Please copy from template and configure:"
    echo "   cp ${ENV_FILE}.template $ENV_FILE"
    echo "   nano $ENV_FILE"
    exit 1
fi

# Pull latest code
echo "📥 Pulling latest code from $BRANCH..."
git fetch origin


# Create required directories
echo "📁 Creating required directories..."
if [[ "$ENVIRONMENT" == "prod" ]]; then
    UPLOADS_DIR="/var/www/dtvisuals/uploads/prod"
else
    UPLOADS_DIR="/var/www/dtvisuals/uploads/dev"
fi

# Ensure uploads directory exists and has proper permissions
mkdir -p "$UPLOADS_DIR"
chown -R dtvisuals:www-data "$UPLOADS_DIR"
chmod -R 755 "$UPLOADS_DIR"

# Create local uploads directory for application if it doesn't exist
mkdir -p uploads
chown -R dtvisuals:www-data uploads
chmod -R 755 uploads

echo "✅ Upload directories created: $UPLOADS_DIR"

# Install dependencies
echo "📦 Installing dependencies..."
if [[ "$ENVIRONMENT" == "prod" ]]; then
    npm ci --production
else
    npm ci
fi

# Build application
echo "🔨 Building application..."
npm run build

# Run database migrations
echo "🗃️ Running database migrations..."
if [[ "$ENVIRONMENT" == "prod" ]]; then
    NODE_ENV=production npm run db:push
else
    NODE_ENV=development npm run db:push
fi

# Restart PM2 application
echo "🔄 Restarting application..."
pm2 restart $PM2_APP || pm2 start ecosystem.config.js --only $PM2_APP

# Wait for application to be ready
echo "⏳ Waiting for application to be ready..."
sleep 10

# Health check
if [[ "$ENVIRONMENT" == "prod" ]]; then
    PORT=5001
else
    PORT=5002
fi

if curl -f http://localhost:$PORT/api/health > /dev/null 2>&1; then
    echo "✅ Application is healthy"
else
    echo "⚠️ Health check failed - check logs with: pm2 logs $PM2_APP"
fi

# Show PM2 status
echo ""
echo "📊 PM2 Status:"
pm2 list

echo ""
echo "✅ Deployment completed successfully!"
echo ""
if [[ "$ENVIRONMENT" == "prod" ]]; then
    echo "🌐 Production URL: https://yourdomain.com"
else
    echo "🌐 Development URL: https://dev.yourdomain.com"
fi
