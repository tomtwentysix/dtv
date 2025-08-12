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
export npm_config_audit=false
export npm_config_fund=false
npm ci --omit=dev --no-audit --no-fund --silent

# Build application
echo "🔨 Building application..."
export QT_QPA_PLATFORM=offscreen
export DISPLAY=:99
export NODE_ENV=production
export HEADLESS=1

# Kill any hanging build processes
pkill -f "vite build" 2>/dev/null || true
pkill -f "npm run build" 2>/dev/null || true

# Use headless-optimized build commands
echo "Building frontend (headless mode)..."
timeout 300 npx vite build --mode production --logLevel error || {
    echo "❌ Frontend build failed or timed out"
    exit 1
}

echo "Building backend..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist || {
    echo "❌ Backend build failed"
    exit 1
}

echo "✅ Build completed successfully"

# Set up environment file if it doesn't exist
ENV_FILE=".env.${ENVIRONMENT}"
if [[ ! -f "$ENV_FILE" ]]; then
    echo "⚙️  Creating $ENV_FILE..."
    if [[ "$ENVIRONMENT" == "prod" ]]; then
        cat > .env.prod << 'EOF'
NODE_ENV=production
PORT=5001
HOST=0.0.0.0
DATABASE_URL=postgresql://dtvisuals:CHANGE_PASSWORD@localhost:5432/dtvisuals_prod
SESSION_SECRET=CHANGE_TO_64_CHAR_RANDOM_STRING
ENABLE_TIMELINE=true
DEBUG=false
DOMAIN=dtvisuals.com
EOF
    else
        cat > .env.dev << 'EOF'
NODE_ENV=development
PORT=5002
HOST=0.0.0.0
DATABASE_URL=postgresql://dtvisuals:CHANGE_PASSWORD@localhost:5432/dtvisuals_dev
SESSION_SECRET=CHANGE_TO_64_CHAR_RANDOM_STRING
ENABLE_TIMELINE=true
DEBUG=true
DOMAIN=dev.dtvisuals.com
EOF
    fi
    chown dtvisuals:dtvisuals "$ENV_FILE"
    chmod 600 "$ENV_FILE"
    echo "❌ Environment file created but needs configuration!"
    echo "   Edit: $ENV_FILE"
    echo "   Set DATABASE_URL password and SESSION_SECRET"
    echo "   Generate secret: openssl rand -hex 64"
    exit 1
fi

# Run database migrations
echo "🗃️  Running database migrations..."
set -a; source "$ENV_FILE"; set +a
if [[ -z "$DATABASE_URL" ]]; then
    echo "❌ DATABASE_URL not configured in $ENV_FILE"
    exit 1
fi
npx drizzle-kit migrate

# Restart application
echo "🔄 Restarting application..."
sudo -u dtvisuals pm2 restart $PM2_APP 2>/dev/null || {
    echo "PM2 app not found, starting new instance..."
    sudo -u dtvisuals pm2 start ecosystem.config.js --only $PM2_APP
}

# Wait for app to be ready
echo "⏳ Waiting for application to start..."
sleep 5

# Health check
echo "🏥 Performing health check..."
HEALTH_URL="http://localhost:$PORT/api/health"
MAX_ATTEMPTS=6
ATTEMPT=1

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    if curl -f -s --connect-timeout 5 --max-time 10 "$HEALTH_URL" > /dev/null 2>&1; then
        echo "✅ Application is healthy"
        break
    else
        if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
            echo "❌ Health check failed after $MAX_ATTEMPTS attempts"
            echo "Check logs: sudo -u dtvisuals pm2 logs $PM2_APP"
            exit 1
        else
            echo "⏳ Attempt $ATTEMPT/$MAX_ATTEMPTS failed, retrying in 10s..."
            sleep 10
            ATTEMPT=$((ATTEMPT + 1))
        fi
    fi
done

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