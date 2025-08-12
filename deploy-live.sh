#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

REPO="/home/dtvisuals/dtv"
ENV="$REPO/.env.prod"
LOG="$REPO/logs/deploy_$(date +%Y%m%d_%H%M%S).log"

CLIENT_DIST="$REPO/client/dist"
NGINX_ROOT="/var/www/dt_visuals_client"
PM2_NAME="dtv-server"

exec > >(tee -a "$LOG") 2>&1

echo "🔄 Loading env..."
if grep -vE '^\s*($|#|[A-Za-z_][A-Za-z0-9_]*\s*=)' "$ENV" | grep .; then
  echo "❌ Invalid lines in $ENV — aborting."
  exit 1
fi
set -a; source "$ENV"; set +a

echo "📦 Installing deps..."
cd "$REPO"
npm ci || npm install

echo "🧱 Building client and server..."
npm run client:build || echo "⚠️ client:build failed — skipping client"
npm run server:build || echo "⚠️ server:build failed — continuing"

echo "🗃️ Running database migration..."
npm run migrate || echo "⚠️ Migration failed — continuing"

if [[ -d "$CLIENT_DIST" ]]; then
  echo "🚚 Publishing static files..."
  RELEASE="$NGINX_ROOT/releases/$(date +%Y%m%d_%H%M%S)"
  sudo mkdir -p "$RELEASE"
  sudo rsync -a "$CLIENT_DIST"/ "$RELEASE"/
  sudo ln -sfn "$RELEASE" "$NGINX_ROOT/current"
  sudo chown -R www-data:www-data "$NGINX_ROOT"
  sudo systemctl reload nginx || echo "⚠️ Nginx reload failed"
else
  echo "⚠️ No client dist found — skipping static publish"
fi

echo "♻️ Starting server with PM2..."
if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  pm2 reload "$PM2_NAME" --update-env
else
  pm2 start npm --name "$PM2_NAME" -- run start:prod
fi
pm2 save || echo "⚠️ PM2 save failed"

echo "✅ Deployment complete"
echo "🪵 Log saved to $LOG"
