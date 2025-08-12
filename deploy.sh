#!/bin/bash

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

# Validate project root
if [[ ! -f "package.json" ]]; then
    echo "❌ Error: package.json not found. Run from project root."
    exit 1
fi

if [[ ! -d "/var/www/dtvisuals" ]]; then
    echo "❌ Error: Must be run on server with /var/www/dtvisuals directory."
    exit 1
fi

# Backup current app
BACKUP_DIR="/var/www/dtvisuals/app.backup.$(date +%Y%m%d-%H%M%S)"
echo "📦 Creating backup at $BACKUP_DIR..."
sudo -u dtvisuals cp -r /var/www/dtvisuals/app "$BACKUP_DIR" 2>/dev/null || true

# Update code
echo "📥 Updating code..."
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

# Install dependencies
echo "📦 Installing all dependencies..."
npm ci --no-audit --no-fund --silent

# Build frontend
echo "⚙️ Building frontend (Vite)..."
cd client
npm ci
npm run build || { echo "❌ Frontend build failed"; exit 1; }
cd ..

# Build backend
echo "⚙️ Building backend..."
mkdir -p dist/server
npx esbuild server/index.ts \
    --platform=node \
    --packages=external \
    --bundle \
    --format=esm \
    --outfile=dist/server/index.js \
    --target=node18 || { echo "❌ Backend build failed"; exit 1; }

echo "✅ Build completed successfully"

# Handle environment file
ENV_FILE="server/.env.${ENVIRONMENT}"

if [[ -f "$ENV_FILE" ]]; then
    if grep -q 'MANUALLY_EDITED' "$ENV_FILE"; then
        echo "🔒 $ENV_FILE already manually configured. Skipping auto-creation."
    else
        echo "📦 Backing up existing $ENV_FILE..."
        cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d-%H%M%S)"
    fi
else
    echo "⚙️ Creating $ENV_FILE..."
    cat > "$ENV_FILE" << EOF
# MANUALLY_EDITED
NODE_ENV=${ENVIRONMENT}
PORT=${PORT}
HOST=0.0.0.0
DATABASE_URL=postgresql://dtvisuals:CHANGE_PASSWORD@localhost:5432/dt_visuals_${ENVIRONMENT}
SESSION_SECRET=CHANGE_TO_64_CHAR_RANDOM_STRING
ENABLE_TIMELINE=true
DEBUG=${ENVIRONMENT == "prod" && echo "false" || echo "true"}
DOMAIN=${ENVIRONMENT == "prod" && echo "dtvisuals.com" || echo "dev.dtvisuals.com"}
EOF

    chown dtvisuals:dtvisuals "$ENV_FILE"
    chmod 600 "$ENV_FILE"

    echo "❌ Environment file created but needs configuration!"
    echo "   ➤ Edit: $ENV_FILE"
    echo "   ➤ Generate secret: openssl rand -hex 64"
    exit 1
fi

# Run database migrations
echo "🗃️ Running database migrations..."
set -a; source "$ENV_FILE"; set +a
if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "❌ DATABASE_URL not configured in $ENV_FILE"
    exit 1
fi
npx drizzle-kit migrate || { echo "❌ Database migrations failed"; exit 1; }

# Prune dev dependencies
echo "📦 Pruning dev dependencies..."
npm prune --production

# Restart PM2
echo "🔄 Restarting application..."
sudo -u dtvisuals pm2 restart "$PM2_APP" 2>/dev/null || {
    echo "PM2 app not found, starting..."
    sudo -u dtvisuals pm2 start ecosystem.config.js --only "$PM2_APP"
}

# Health check
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

# Final status
echo ""
echo "📊 Current Status:"
sudo -u dtvisuals pm2 list | grep dtvisuals || true
echo ""
echo "✅ Deployment completed!"
echo "🌐 URL: https://${ENVIRONMENT == "prod" && echo "dtvisuals.com" || echo "dev.dtvisuals.com"}"
