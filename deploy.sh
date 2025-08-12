#!/bin/bash

# ============================================
# DT Visuals Manual Deployment Script (Improved + Vite Fix)
# Usage: ./deploy.sh [prod|dev] [branch]
# ============================================

set -euo pipefail

ENVIRONMENT=${1:-prod}
BRANCH=${2:-main}

if [[ "$ENVIRONMENT" != "prod" && "$ENVIRONMENT" != "dev" ]]; then
    echo "Usage: ./deploy.sh [prod|dev] [branch]"
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

# ---- Safety Checks ----
if [[ ! -f "package.json" ]]; then
    echo "❌ Error: package.json not found. Run from project root."
    exit 1
fi

if [[ ! -d "/var/www/dtvisuals" ]]; then
    echo "❌ Error: Must be run on the server with /var/www/dtvisuals directory."
    exit 1
fi

# ---- Backup ----
BACKUP_DIR="/var/www/dtvisuals/app.backup.$(date +%Y%m%d-%H%M%S)"
echo "📦 Creating backup at $BACKUP_DIR..."
sudo -u dtvisuals cp -r /var/www/dtvisuals/app "$BACKUP_DIR" 2>/dev/null || true

# ---- Update Code ----
echo "📥 Updating code..."
git fetch origin
git reset --hard
git checkout "$BRANCH"
git pull origin "$BRANCH" --ff-only

# ---- Install Dependencies ----
echo "📦 Installing dependencies..."
export npm_config_audit=false
export npm_config_fund=false
npm ci --omit=dev --no-audit --no-fund --silent || npm install --omit=dev --no-audit --no-fund --silent

# ---- Build Application ----
echo "🔨 Building application..."
export QT_QPA_PLATFORM=offscreen
export DISPLAY=:99
export NODE_ENV=production
export HEADLESS=1

# Kill only if running
pgrep -f "vite build" && pkill -f "vite build"
pgrep -f "npm run build" && pkill -f "npm run build"

echo "⚙️ Building frontend (Vite fix applied)..."
timeout 300 npx --yes --package vite vite build --mode production --logLevel error || {
    echo "❌ Frontend build failed"
    exit 1
}

if [[ ! -d "dist" ]]; then
    echo "❌ Frontend build directory missing"
    exit 1
fi

echo "⚙️ Building backend..."
mkdir -p dist/server
npx esbuild server/index.ts \
    --platform=node \
    --packages=external \
    --bundle \
    --format=esm \
    --outfile=dist/server/index.js \
    --target=node18 || {
        echo "❌ Backend build failed"
        exit 1
    }

echo "✅ Build completed successfully"

# ---- Environment File ----
ENV_FILE=".env.${ENVIRONMENT}"
if [[ ! -f "$ENV_FILE" ]]; then
    echo "⚙️ Creating $ENV_FILE..."
    if [[ "$ENVIRONMENT" == "prod" ]]; then
        cat > "$ENV_FILE" << 'EOF'
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
        cat > "$ENV_FILE" << 'EOF'
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

    if id "dtvisuals" &>/dev/null; then
        chown dtvisuals:dtvisuals "$ENV_FILE"
        chmod 600 "$ENV_FILE"
    fi

    echo "❌ Environment file created but needs configuration!"
    echo "   Edit: $ENV_FILE"
    echo "   Generate secret: openssl rand -hex 64"
    exit 1
fi

# ---- Database Migrations ----
echo "🗃️ Running database migrations..."
set -a; source "$ENV_FILE"; set +a
if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "❌ DATABASE_URL not configured in $ENV_FILE"
    exit 1
fi
npx drizzle-kit migrate

# ---- Restart Application ----
echo "🔄 Restarting application..."
sudo -u dtvisuals pm2 restart "$PM2_APP" 2>/dev/null || {
    echo "PM2 app not found, starting..."
    sudo -u dtvisuals pm2 start ecosystem.config.js --only "$PM2_APP"
}

# ---- Health Check ----
echo "⏳ Waiting for application to start..."
sleep 5
HEALTH_URL="http://localhost:$PORT/api/health"
MAX_ATTEMPTS=6

for ((ATTEMPT=1; ATTEMPT<=MAX_ATTEMPTS; ATTEMPT++)); do
    if curl -fs --connect-timeout 5 --max-time 10 "$HEALTH_URL" | grep -q '"status":"ok"'; then
        echo "✅ Application is healthy"
        break
    fi
    if [[ $ATTEMPT -eq $MAX_ATTEMPTS ]]; then
        echo "❌ Health check failed after $MAX_ATTEMPTS attempts"
        echo "Check logs: sudo -u dtvisuals pm2 logs $PM2_APP"
        exit 1
    fi
    echo "⏳ Attempt $ATTEMPT/$MAX_ATTEMPTS failed, retrying in 10s..."
    sleep 10
done

# ---- Final Status ----
echo ""
echo "📊 Current Status:"
sudo -u dtvisuals pm2 list | grep dtvisuals || true
echo ""
echo "✅ Deployment completed!"
if [[ "$ENVIRONMENT" == "prod" ]]; then
    echo "🌐 Production URL: https://dtvisuals.com"
else
    echo "🌐 Development URL: https://dev.dtvisuals.com"
fi
