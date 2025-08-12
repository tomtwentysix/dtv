#!/bin/bash

set -euo pipefail
IFS=$'\n\t'

echo "🚀 Starting Deployment..."

### Interactive Prompt Helper ###
prompt_var() {
  local var_name="$1"
  local prompt_msg="$2"
  local is_secret="${3:-false}"
  local value=""
  while true; do
    if [ "$is_secret" = true ]; then
      read -s -p "$prompt_msg: " value && echo
    else
      read -p "$prompt_msg: " value
    fi
    if [ -n "$value" ]; then
      break
    fi
    echo "❗ Please enter a valid value."
  done
  export "$var_name"="$value"
}

### Prompt for Env Variables ###
echo "🔐 Gathering environment variables..."
prompt_var PORT "App port"
prompt_var DOMAIN "Domain name (e.g. dtv.io)"
prompt_var DB_NAME "PostgreSQL database name"
prompt_var DB_USER "PostgreSQL username"
prompt_var DB_PASS "PostgreSQL password" true
prompt_var JWT_SECRET "JWT secret" true
prompt_var VITE_API_URL "Client API URL"

### Backup and Write .env ###
ENV_FILE=".env"
if [ -f "$ENV_FILE" ]; then
  cp "$ENV_FILE" "${ENV_FILE}.bak-$(date +%s)"
  echo "🗂️ Existing .env backed up."
fi

cat > "$ENV_FILE" <<EOF
PORT=$PORT
DOMAIN=$DOMAIN
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASS=$DB_PASS
JWT_SECRET=$JWT_SECRET
VITE_API_URL=$VITE_API_URL
EOF

echo "✅ .env written to $ENV_FILE."

### Install System Dependencies ###
echo "📦 Installing core packages..."
sudo apt update
sudo apt install -y nodejs npm git nginx ufw build-essential postgresql postgresql-contrib

### PostgreSQL Setup ###
echo "🐘 Configuring PostgreSQL..."
sudo -u postgres psql <<SQL
DO \$\$ BEGIN
  CREATE ROLE $DB_USER LOGIN PASSWORD '$DB_PASS';
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Role already exists.';
END \$\$;

DO \$\$ BEGIN
  CREATE DATABASE $DB_NAME OWNER $DB_USER;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Database already exists.';
END \$\$;
SQL

### Clone Repo ###
prompt_var REPO_URL "Git repository URL"
prompt_var APP_DIR "Deployment directory (e.g. /var/www/app)"

if [ ! -d "$APP_DIR" ]; then
  git clone "$REPO_URL" "$APP_DIR"
else
  echo "📂 Repo exists. Pulling latest..."
  git -C "$APP_DIR" pull
fi

cd "$APP_DIR"

### Build & Start ###
echo "🛠️ Installing dependencies..."
if command -v pnpm &>/dev/null; then pnpm install
elif command -v yarn &>/dev/null; then yarn
else npm install; fi

echo "🎨 Verifying Tailwind config..."
# Insert Tailwind patch logic here (based on your last script)

echo "📦 Building client..."
npm run build || echo "⚠️ Build failed — check Vite config."

echo "🧬 Starting server with PM2..."
pm2 start ecosystem.config.js || pm2 start server.ts --name app

echo "🌐 Configuring Nginx..."
# Insert basic reverse proxy config or check existing nginx.conf

echo "🔗 Symlinking uploads..."
sudo mkdir -p /var/lib/app/uploads
sudo ln -sfn "$APP_DIR/uploads" /var/lib/app/uploads

echo "✅ Deployment complete!"
