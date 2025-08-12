#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

#####################################
# Config — adjust to your repo
#####################################
# Absolute path to the repo root
REPO_DIR="/home/dtvisuals/dtv"

# Root env file for live
ENV_FILE="$REPO_DIR/.env.prod"

# Client and server paths
CLIENT_DIR="$REPO_DIR/client"
SERVER_DIR="$REPO_DIR/server"

# Drizzle config
DRIZZLE_CONFIG="$REPO_DIR/drizzle.config.ts"

# PM2
PM2_APP_NAME="dtv-server"   # PM2 process name
# If you have an ecosystem file, set it here (script autodetects too)
PM2_ECOSYSTEM="$SERVER_DIR/ecosystem.config.cjs"

# Nginx static root for client, served as: root /var/www/dt_visuals_client/current;
NGINX_ROOT="/var/www/dt_visuals_client"

# Package manager preference (auto-detects if empty)
PKG_MGR=""

#####################################
# Logging & traps
#####################################
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
LOG_DIR="$REPO_DIR/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/deploy_${TIMESTAMP}.log"
exec > >(tee -a "$LOG_FILE") 2>&1

on_error() {
  echo "❌ Error on line $1. See log: $LOG_FILE"
}
trap 'on_error $LINENO' ERR

#####################################
# Helpers
#####################################
require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "❌ Required command missing: $1"
    exit 1
  fi
}

pick_pkg_mgr() {
  if [[ -n "$PKG_MGR" ]]; then
    echo "$PKG_MGR"
    return
  fi
  if command -v pnpm >/dev/null 2>&1 && [[ -f "$1/pnpm-lock.yaml" ]]; then
    echo "pnpm"
  elif command -v yarn >/dev/null 2>&1 && [[ -f "$1/yarn.lock" ]]; then
    echo "yarn"
  else
    echo "npm"
  fi
}

install_deps() {
  local dir="$1"
  local mgr
  mgr="$(pick_pkg_mgr "$dir")"
  echo "📦 Installing dependencies in $dir with $mgr"
  pushd "$dir" >/dev/null
  case "$mgr" in
    pnpm)
      pnpm install --frozen-lockfile
      ;;
    yarn)
      yarn install --frozen-lockfile || yarn install
      ;;
    npm)
      if [[ -f package-lock.json ]]; then
        npm ci
      else
        npm install
      fi
      ;;
  esac
  popd >/dev/null
}

run_script_if_present() {
  local dir="$1"
  local script_name="$2"
  if jq -e --arg s "$script_name" '.scripts[$s] // empty' "$dir/package.json" >/dev/null 2>&1; then
    echo "▶️ Running $script_name in $dir"
    pushd "$dir" >/dev/null
    local mgr
    mgr="$(pick_pkg_mgr "$dir")"
    case "$mgr" in
      pnpm) pnpm run "$script_name" ;;
      yarn) yarn "$script_name" ;;
      npm)  npm run "$script_name" ;;
    esac
    popd >/dev/null
  else
    echo "ℹ️ No $script_name script in $dir/package.json — skipping"
  fi
}

ensure_db_exists() {
  # Requires DATABASE_URL in env. Creates DB if missing by connecting to 'postgres'.
  if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "❌ DATABASE_URL not set in environment"
    exit 1
  fi
  # Extract db name
  local dbname="${DATABASE_URL##*/}"
  dbname="${dbname%%\?*}"
  if [[ -z "$dbname" ]]; then
    echo "❌ Unable to parse database name from DATABASE_URL"
    exit 1
  fi
  local admin_url="${DATABASE_URL%/*}/postgres"
  echo "🗄️ Ensuring database exists: $dbname"
  require_cmd psql
  local exists
  if ! exists="$(psql "$admin_url" -Atc "SELECT 1 FROM pg_database WHERE datname='${dbname}'" 2>/dev/null || true)"; then
    exists=""
  fi
  if [[ "$exists" != "1" ]]; then
    echo "➕ Creating database $dbname"
    psql "$admin_url" -v ON_ERROR_STOP=1 -c "CREATE DATABASE ${dbname}"
  else
    echo "✅ Database exists"
  fi
}

drizzle_migrate() {
  echo "🗃️ Running database migrations (Drizzle)"
  # Prefer project script "migrate" if present at repo root
  if [[ -f "$REPO_DIR/package.json" ]] && jq -e '.scripts.migrate // empty' "$REPO_DIR/package.json" >/dev/null 2>&1; then
    pushd "$REPO_DIR" >/dev/null
    local mgr
    mgr="$(pick_pkg_mgr "$REPO_DIR")"
    case "$mgr" in
      pnpm) pnpm run migrate ;;
      yarn) yarn migrate ;;
      npm)  npm run migrate ;;
    esac
    popd >/dev/null
  else
    # Fallback to drizzle-kit CLI
    require_cmd npx
    npx --yes drizzle-kit migrate --config "$DRIZZLE_CONFIG"
  fi
}

pm2_reload_or_start() {
  require_cmd pm2
  export NODE_ENV=production
  # If ecosystem file exists, use it (supports env_production)
  if [[ -f "$PM2_ECOSYSTEM" ]]; then
    echo "♻️ PM2 startOrReload via ecosystem: $PM2_ECOSYSTEM"
    pm2 startOrReload "$PM2_ECOSYSTEM" --env production
  elif [[ -f "$SERVER_DIR/ecosystem.config.js" ]]; then
    echo "♻️ PM2 startOrReload via ecosystem: ecosystem.config.js"
    pm2 startOrReload "$SERVER_DIR/ecosystem.config.js" --env production
  else
    # No ecosystem — try to reuse or start via package scripts
    echo "♻️ PM2 reload/start $PM2_APP_NAME"
    if pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
      pm2 reload "$PM2_APP_NAME" --update-env
    else
      # Prefer start:prod, then start
      pushd "$SERVER_DIR" >/dev/null
      if jq -e '.scripts["start:prod"] // empty' package.json >/dev/null 2>&1; then
        pm2 start npm --name "$PM2_APP_NAME" -- run start:prod
      elif jq -e '.scripts.start // empty' package.json >/dev/null 2>&1; then
        pm2 start npm --name "$PM2_APP_NAME" -- run start
      elif [[ -f "dist/server.js" ]]; then
        pm2 start dist/server.js --name "$PM2_APP_NAME"
      else
        echo "❌ No clear server entrypoint found; please define start script or ecosystem"
        exit 1
      fi
      popd >/dev/null
    fi
  fi
  pm2 save || true
}

atomic_static_publish() {
  # Atomically publish client build to NGINX root using a versioned release + symlink swap
  local dist_dir="$CLIENT_DIR/dist"
  if [[ ! -d "$dist_dir" ]]; then
    echo "❌ Client build directory not found: $dist_dir"
    exit 1
  fi
  require_cmd rsync
  sudo mkdir -p "$NGINX_ROOT/releases"
  local release_dir="$NGINX_ROOT/releases/$TIMESTAMP"
  echo "🚚 Publishing client to $release_dir"
  sudo mkdir -p "$release_dir"
  sudo rsync -a --delete "$dist_dir"/ "$release_dir"/
  sudo ln -sfn "$release_dir" "$NGINX_ROOT/current"
  sudo chown -R www-data:www-data "$NGINX_ROOT"
  # Nginx reload is optional for static, but harmless if site config changed
  if command -v systemctl >/dev/null 2>&1; then
    sudo systemctl reload nginx || true
  fi
  echo "✅ Client published atomically: $NGINX_ROOT/current -> $release_dir"
}

#####################################
# Preflight checks
#####################################
echo "🔎 Preflight checks"
require_cmd jq
require_cmd git
require_cmd node
require_cmd npm
require_cmd pm2
require_cmd rsync
require_cmd nginx

# Validate env file format to avoid sourcing bare lines
if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ Env file not found: $ENV_FILE"
  exit 1
fi
if grep -vE '^\s*($|#|[A-Za-z_][A-Za-z0-9_]*\s*=)' "$ENV_FILE" | sed 's/^/ - /' | grep .; then
  echo "❌ Invalid lines in $ENV_FILE (must be KEY=VALUE or comments). Fix before deploying."
  exit 1
fi

# Source env
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a
export NODE_ENV=production

#####################################
# Deploy flow
#####################################
echo "🚀 Live deployment started at $TIMESTAMP"
echo "📁 Repo: $REPO_DIR"

# Optional: sync code (comment out if using CI artifacts)
if [[ -d "$REPO_DIR/.git" ]]; then
  echo "⬇️ Updating repo (fast-forward only)"
  git -C "$REPO_DIR" fetch --all --prune
  git -C "$REPO_DIR" pull --ff-only
fi

# Install & build server
if [[ -f "$SERVER_DIR/package.json" ]]; then
  install_deps "$SERVER_DIR"
  run_script_if_present "$SERVER_DIR" "build"
else
  echo "ℹ️ No server package.json found at $SERVER_DIR — skipping server build"
fi

# Install & build client
if [[ -f "$CLIENT_DIR/package.json" ]]; then
  install_deps "$CLIENT_DIR"
  # Vite uses VITE_* from env; ensure they are present in .env.prod if needed
  run_script_if_present "$CLIENT_DIR" "build"
else
  echo "ℹ️ No client package.json found at $CLIENT_DIR — skipping client build"
fi

# Database migrations (ensure DB exists first)
if [[ -n "${DATABASE_URL:-}" ]]; then
  ensure_db_exists
  drizzle_migrate
else
  echo "⚠️ DATABASE_URL not set — skipping migrations"
fi

# Publish client atomically to Nginx
if [[ -d "$CLIENT_DIR/dist" ]]; then
  atomic_static_publish
else
  echo "⚠️ Client dist not found — skipping static publish"
fi

# Reload/start server via PM2
pm2_reload_or_start

echo "✅ Live deployment complete"
echo "🪵 Log: $LOG_FILE"
