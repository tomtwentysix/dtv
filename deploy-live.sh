#!/usr/bin/env bash
set -Eeuo pipefail

# =========================================
# Logging & helpers
# =========================================
LOG_FILE="/var/log/app-deploy.log"

log() { echo -e "[$(date +'%F %T')] $*" | tee -a "$LOG_FILE"; }
fail() { echo -e "[$(date +'%F %T')] ❌ $*" | tee -a "$LOG_FILE" >&2; exit 1; }

require_root() {
  if [[ ${EUID:-$(id -u)} -ne 0 ]]; then
    fail "This script must be run as root. Try: sudo bash $0"
  fi
}

prompt() {
  local var="$1" prompt="$2" default="${3:-}"
  local current="${!var:-}"
  if [[ -n "$current" ]]; then
    log "Using $var from environment."
    return
  fi
  if [[ -n "$default" ]]; then
    read -r -p "$prompt [$default]: " input || true
    input="${input:-$default}"
  else
    read -r -p "$prompt: " input || true
    while [[ -z "${input:-}" ]]; do
      read -r -p "$prompt (required): " input || true
    done
  fi
  printf -v "$var" "%s" "$input"
}

ensure_pkg() {
  local pkg="$1"
  dpkg -s "$pkg" >/dev/null 2>&1 || apt-get install -y "$pkg" >>"$LOG_FILE" 2>&1
}

# =========================================
# Preflight
# =========================================
require_root
mkdir -p "$(dirname "$LOG_FILE")"
log "Starting deployment..."

if ! command -v apt-get >/dev/null 2>&1; then
  fail "This script targets Debian/Ubuntu (apt). Detected a non-apt system."
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -y >>"$LOG_FILE" 2>&1
ensure_pkg ca-certificates
ensure_pkg curl
ensure_pkg gnupg
ensure_pkg git
ensure_pkg build-essential
ensure_pkg rsync
ensure_pkg jq

# =========================================
# Gather inputs
# =========================================
DEFAULT_APP_NAME="$(basename "$(pwd)")"
prompt APP_NAME "Application name" "$DEFAULT_APP_NAME"
prompt APP_USER "System user to run the app (non-root)" "$APP_NAME"
prompt APP_DIR  "Absolute app directory" "/opt/${APP_NAME}"
prompt REPO_SOURCE "Use current directory or clone? (current/clone)" "current"

if [[ "$REPO_SOURCE" == "clone" ]]; then
  prompt REPO_URL "Git repository URL"
  prompt REPO_BRANCH "Git branch" "main"
fi

prompt NODE_MAJOR "Node.js major version" "20"
prompt SERVER_PORT "Node server port" "3000"
prompt API_BASE_PATH "API base path for Nginx proxy" "/api"
prompt DOMAIN_NAME "Public domain (leave empty to skip TLS)" ""
prompt ENABLE_DB "Configure PostgreSQL? (y/n)" "n"

if [[ "$ENABLE_DB" =~ ^[Yy]$ ]]; then
  prompt DB_NAME "PostgreSQL database name" "${APP_NAME}"
  prompt DB_USER "PostgreSQL user" "${APP_NAME}"
  prompt DB_PASS "PostgreSQL password"
  prompt DB_HOST "PostgreSQL host" "127.0.0.1"
  prompt DB_PORT "PostgreSQL port" "5432"
fi

# =========================================
# System setup: Node, PM2, Nginx, Postgres (optional)
# =========================================
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | sed 's/v\([0-9]*\).*/\1/')" -ne "$NODE_MAJOR" ]]; then
  log "Installing Node.js ${NODE_MAJOR}.x..."
  curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash - >>"$LOG_FILE" 2>&1
  apt-get install -y nodejs >>"$LOG_FILE" 2>&1
fi
log "Node: $(node -v), npm: $(npm -v)"

if ! command -v pm2 >/dev/null 2>&1; then
  log "Installing PM2 globally..."
  npm i -g pm2 >>"$LOG_FILE" 2>&1
fi

if ! command -v nginx >/dev/null 2>&1; then
  log "Installing Nginx..."
  apt-get install -y nginx >>"$LOG_FILE" 2>&1
fi

if [[ "${ENABLE_DB:-n}" =~ ^[Yy]$ ]]; then
  if ! command -v psql >/dev/null 2>&1; then
    log "Installing PostgreSQL server and client..."
    apt-get install -y postgresql postgresql-contrib >>"$LOG_FILE" 2>&1
  fi
fi

# =========================================
# System user & directories
# =========================================
if ! id -u "$APP_USER" >/dev/null 2>&1; then
  log "Creating system user: $APP_USER"
  useradd --system --create-home --shell /usr/sbin/nologin "$APP_USER"
fi

mkdir -p "$APP_DIR"
chown -R "$APP_USER":"$APP_USER" "$APP_DIR"

# =========================================
# Acquire repo
# =========================================
if [[ "$REPO_SOURCE" == "clone" ]]; then
  if [[ -d "$APP_DIR/.git" ]]; then
    log "Repo present, pulling latest..."
    sudo -u "$APP_USER" bash -lc "cd '$APP_DIR' && git fetch --all && git checkout '$REPO_BRANCH' && git pull --ff-only origin '$REPO_BRANCH'" >>"$LOG_FILE" 2>&1
  else
    log "Cloning $REPO_URL into $APP_DIR (branch $REPO_BRANCH)..."
    sudo -u "$APP_USER" bash -lc "git clone --branch '$REPO_BRANCH' '$REPO_URL' '$APP_DIR'" >>"$LOG_FILE" 2>&1
  fi
else
  SRC_DIR="$(pwd)"
  if [[ "$SRC_DIR" != "$APP_DIR" ]]; then
    log "Syncing current directory to $APP_DIR (rsync)…"
    rsync -aH --delete --exclude='.git' --exclude='node_modules' --exclude='uploads' "$SRC_DIR"/ "$APP_DIR"/ >>"$LOG_FILE" 2>&1
    chown -R "$APP_USER":"$APP_USER" "$APP_DIR"
  fi
fi

cd "$APP_DIR"

# =========================================
# Project sanity checks & persistent uploads
# =========================================
for req in client server; do
  [[ -d "$req" ]] || fail "Required directory '$req' not found at $APP_DIR"
done

UPLOAD_DIR="$APP_DIR/uploads"
mkdir -p "$UPLOAD_DIR"
chown -R "$APP_USER":"$APP_USER" "$UPLOAD_DIR"

# =========================================
# Dependencies
# =========================================
log "Installing root dependencies (if present)…"
if [[ -f package.json ]]; then
  sudo -u "$APP_USER" bash -lc "cd '$APP_DIR' && (npm ci || npm install)" >>"$LOG_FILE" 2>&1
fi

log "Installing client dependencies…"
[[ -f client/package.json ]] || fail "client/package.json not found."
sudo -u "$APP_USER" bash -lc "cd '$APP_DIR/client' && (npm ci || npm install)" >>"$LOG_FILE" 2>&1

# Ensure build tools present
log "Ensuring dev tools (vite, esbuild)…"
sudo -u "$APP_USER" bash -lc "cd '$APP_DIR/client' && (npm pkg get devDependencies.vite >/dev/null 2>&1 || npm i -D vite)" >>"$LOG_FILE" 2>&1
sudo -u "$APP_USER" bash -lc "cd '$APP_DIR' && (npm pkg get devDependencies.esbuild >/dev/null 2>&1 || npm i -D esbuild)" >>"$LOG_FILE" 2>&1

# Optional: update browserslist DB (no-fail)
sudo -u "$APP_USER" bash -lc "cd '$APP_DIR/client' && npx update-browserslist-db@latest" >>"$LOG_FILE" 2>&1 || true

# =========================================
# Build client (Vite)
# =========================================
log "Building React client with Vite…"
sudo -u "$APP_USER" bash -lc "cd '$APP_DIR/client' && npx vite build" 2>&1 | tee -a "$LOG_FILE"

# Determine client output index
CLIENT_INDEX_CANDIDATES=(
  "$APP_DIR/dist/public/index.html"  # when root is repo and outDir set in vite.config
  "$APP_DIR/client/dist/index.html"  # vite default when run inside client
)
CLIENT_INDEX=""
for p in "${CLIENT_INDEX_CANDIDATES[@]}"; do
  if [[ -f "$p" ]]; then CLIENT_INDEX="$p"; break; fi
done
[[ -n "$CLIENT_INDEX" ]] || fail "Client build succeeded but index.html not found in expected locations."
CLIENT_OUT_DIR="$(dirname "$CLIENT_INDEX")"
log "Client build OK: $CLIENT_INDEX"

# =========================================
# Auto-detect routes from JSX/TSX and create static fallbacks
# =========================================
log "Scanning for route paths in client/src…"
ROUTE_TMP="$(mktemp)"
# React Router JSX: <Route path="/about" …>
grep -RhoE '<Route[^>]*\spath=("[^"]+"|'\''[^'\'']+'\'')' client/src \
  | sed -E 's/.*path=(["'\''])([^"'\'' >}]+)\1.*/\2/' >>"$ROUTE_TMP" || true

# Object configs: path: "/about"
grep -RhoE 'path\s*:\s*("([^"]+)"|'\''([^'\'']+)'\'' )' client/src \
  | sed -E 's/.*path\s*:\s*(["'\''])([^"'\'' >}]+)\1.*/\2/' >>"$ROUTE_TMP" || true

# File-based pages (optional convention): client/src/pages/Some.tsx -> /some
if [[ -d client/src/pages ]]; then
  while IFS= read -r f; do
    name="$(basename "$f")"
    base="${name%.*}"
    if [[ "$base" =~ ^index$|^Index$ ]]; then
      echo "/" >>"$ROUTE_TMP"
    else
      echo "/$(echo "$base" | tr '[:upper:]' '[:lower:]')" >>"$ROUTE_TMP"
    fi
  done < <(find client/src/pages -type f \( -name '*.tsx' -o -name '*.jsx' \))
fi

# Normalize, dedupe, and filter out dynamic/wildcard
mapfile -t ROUTES < <(sed 's#//*/#/#g' "$ROUTE_TMP" \
  | sed 's#^\([^/]\)#/\1#' \
  | sed 's#//*#/#g' \
  | grep -E '^/' \
  | grep -vE '[:*]' \
  | sort -u)
rm -f "$ROUTE_TMP"

# Create fallback HTML files for static routes (copy index.html)
if [[ "${#ROUTES[@]}" -gt 0 ]]; then
  log "Creating static fallbacks for detected routes…"
  for route in "${ROUTES[@]}"; do
    [[ "$route" == "/" ]] && continue
    target_dir="${CLIENT_OUT_DIR}${route%/}"
    mkdir -p "$target_dir"
    cp -f "$CLIENT_INDEX" "${target_dir}/index.html"
    log "→ Fallback created: ${route} -> ${target_dir}/index.html"
  done
else
  log "No static routes detected (only SPA)."
fi

# Emit routes list for auditing
echo "${ROUTES[@]:-}" | tr ' ' '\n' > "${CLIENT_OUT_DIR}/_routes.txt" || true

# =========================================
# Build server (TypeScript -> dist/server/index.js)
# =========================================
mkdir -p "$APP_DIR/dist/server"
log "Building server with esbuild…"
sudo -u "$APP_USER" bash -lc "cd '$APP_DIR' && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/server/index.js --target=node18" 2>&1 | tee -a "$LOG_FILE"
[[ -f "$APP_DIR/dist/server/index.js" ]] || fail "Server build failed: dist/server/index.js missing."
log "Server build OK."

# =========================================
# PM2 ecosystem & environment
# =========================================
ECOSYSTEM_FILE="$APP_DIR/ecosystem.config.cjs"
log "Writing PM2 ecosystem file…"
cat > "$ECOSYSTEM_FILE" <<'EOF'
module.exports = {
  apps: [
    {
      name: process.env.APP_NAME || 'app',
      script: 'dist/server/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || '3000',
        UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
        DB_NAME: process.env.DB_NAME || '',
        DB_USER: process.env.DB_USER || '',
        DB_PASS: process.env.DB_PASS || '',
        DB_HOST: process.env.DB_HOST || '127.0.0.1',
        DB_PORT: process.env.DB_PORT || '5432'
      }
    }
  ]
}
EOF
chown "$APP_USER":"$APP_USER" "$ECOSYSTEM_FILE"

ENV_FILE="$APP_DIR/.env.production"
log "Writing environment file…"
{
  echo "APP_NAME=$APP_NAME"
  echo "PORT=$SERVER_PORT"
  echo "UPLOAD_DIR=$UPLOAD_DIR"
  if [[ "${ENABLE_DB:-n}" =~ ^[Yy]$ ]]; then
    echo "DB_NAME=$DB_NAME"
    echo "DB_USER=$DB_USER"
    echo "DB_PASS=$DB_PASS"
    echo "DB_HOST=${DB_HOST:-127.0.0.1}"
    echo "DB_PORT=${DB_PORT:-5432}"
  fi
} > "$ENV_FILE"
chown "$APP_USER":"$APP_USER" "$ENV_FILE"
chmod 600 "$ENV_FILE"

# =========================================
# Database setup (optional)
# =========================================
if [[ "${ENABLE_DB:-n}" =~ ^[Yy]$ ]]; then
  log "Configuring PostgreSQL user/database (idempotent)…"
  sudo -u postgres psql <<SQL >>"$LOG_FILE" 2>&1
DO
\$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
      CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}';
   END IF;
END
\$\$;

DO
\$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}') THEN
      CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};
   END IF;
END
\$\$;
SQL
  log "PostgreSQL ready (user: ${DB_USER}, db: ${DB_NAME})."
fi

# =========================================
# PM2 run & persist
# =========================================
log "Starting (or reloading) app with PM2…"
sudo -u "$APP_USER" bash -lc "cd '$APP_DIR' && export \$(grep -v '^#' .env.production | xargs) && pm2 startOrReload ecosystem.config.cjs --update-env" >>"$LOG_FILE" 2>&1
pm2 save >>"$LOG_FILE" 2>&1 || true
pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" >>"$LOG_FILE" 2>&1 || true

# =========================================
# Nginx config (SPA + uploads + API proxy)
# =========================================
SITE_FILE="/etc/nginx/sites-available/${APP_NAME}.conf"
PUBLIC_ROOT=""
if [[ -f "$APP_DIR/dist/public/index.html" ]]; then
  PUBLIC_ROOT="$APP_DIR/dist/public"
elif [[ -f "$APP_DIR/client/dist/index.html" ]]; then
  PUBLIC_ROOT="$APP_DIR/client/dist"
else
  fail "Cannot locate built client index.html for Nginx root."
fi

log "Writing Nginx site config…"
cat > "$SITE_FILE" <<NGINX
server {
  listen 80;
  server_name ${DOMAIN_NAME:-_};

  # Serve frontend
  root ${PUBLIC_ROOT};
  index index.html;

  # Static uploads
  location /uploads/ {
    alias ${UPLOAD_DIR}/;
    add_header Cache-Control "no-cache";
  }

  # SPA fallback
  location / {
    try_files \$uri \$uri/ /index.html;
  }

  # API proxy
  location ${API_BASE_PATH} {
    proxy_pass http://127.0.0.1:${SERVER_PORT};
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
  }

  # Security headers
  add_header X-Content-Type-Options nosniff;
  add_header X-Frame-Options SAMEORIGIN;
  add_header Referrer-Policy strict-origin-when-cross-origin;
}
NGINX

ln -sf "$SITE_FILE" "/etc/nginx/sites-enabled/${APP_NAME}.conf"
[[ -f /etc/nginx/sites-enabled/default ]] && rm -f /etc/nginx/sites-enabled/default

log "Testing Nginx configuration…"
nginx -t 2>&1 | tee -a "$LOG_FILE"
systemctl reload nginx

# =========================================
# TLS (optional)
# =========================================
if [[ -n "${DOMAIN_NAME:-}" ]]; then
  read -r -p "Obtain Let's Encrypt certificate for ${DOMAIN_NAME}? (y/n) [y]: " ENABLE_TLS
  ENABLE_TLS="${ENABLE_TLS:-y}"
  if [[ "$ENABLE_TLS" =~ ^[Yy]$ ]]; then
    read -r -p "Admin email for Let's Encrypt: " ADMIN_EMAIL
    log "Installing certbot…"
    apt-get install -y certbot python3-certbot-nginx >>"$LOG_FILE" 2>&1
    log "Requesting certificate…"
    certbot --nginx -d "$DOMAIN_NAME" --non-interactive --agree-tos -m "$ADMIN_EMAIL" --redirect || \
      log "Certbot could not complete automatically. You can run certbot manually later."
  fi
fi

# =========================================
# Final checks & summary
# =========================================
log "Verifying app is listening on port ${SERVER_PORT}…"
sleep 2
if ss -lnt | awk '{print $4}' | grep -q ":${SERVER_PORT}\$"; then
  log "App appears to be running on port ${SERVER_PORT}."
else
  log "Warning: app not detected on port ${SERVER_PORT}. Check 'pm2 logs ${APP_NAME}' for details."
fi

log "Routes audit (static fallbacks created for these paths):"
if [[ -f "${CLIENT_OUT_DIR}/_routes.txt" ]]; then
  awk '{print "- " $0}' "${CLIENT_OUT_DIR}/_routes.txt" | tee -a "$LOG_FILE"
else
  log "- (none detected)"
fi

log "Deployment complete. Summary:"
log "- App user:        $APP_USER"
log "- App dir:         $APP_DIR"
log "- Uploads dir:     $UPLOAD_DIR"
log "- Public root:     $PUBLIC_ROOT"
log "- Server port:     $SERVER_PORT"
log "- API base path:   $API_BASE_PATH"
[[ -n "${DOMAIN_NAME:-}" ]] && log "- Domain:          $DOMAIN_NAME"

exit 0
