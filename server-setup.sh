#!/bin/bash

# DT Visuals Server Setup Script
# Ubuntu 20.04/22.04 LTS
# Run as root or with sudo

set -e

echo "=== DT Visuals Server Setup ==="
echo "Setting up Ubuntu server with Node.js, PostgreSQL, Nginx, and PM2"

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install essential packages
echo "🔧 Installing essential packages..."
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release ufw fail2ban

# Install Node.js 20 LTS
echo "📦 Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify Node.js installation
echo "✅ Node.js version: $(node --version)"
echo "✅ NPM version: $(npm --version)"

# Install PostgreSQL 15
echo "📦 Installing PostgreSQL 15..."
apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Install Nginx
echo "📦 Installing Nginx..."
apt install -y nginx

# Install Certbot for Let's Encrypt
echo "📦 Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# Install PM2 globally
echo "📦 Installing PM2..."
npm install -g pm2

# Create dtvisuals user
echo "👤 Creating dtvisuals user..."
if ! id -u dtvisuals >/dev/null 2>&1; then
    useradd -m -s /bin/bash dtvisuals
    usermod -aG www-data dtvisuals
fi

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p /var/www/dtvisuals/{app,uploads/{prod,dev}}
mkdir -p /var/log/dtvisuals
mkdir -p /var/www/certbot

# Set proper permissions
chown -R dtvisuals:www-data /var/www/dtvisuals
chmod -R 755 /var/www/dtvisuals
chown -R www-data:www-data /var/www/certbot

# Setup PostgreSQL databases and user
echo "💾 Setting up PostgreSQL..."
sudo -u postgres psql << EOF
-- Create dtvisuals user
CREATE USER dtvisuals WITH PASSWORD 'CHANGE_THIS_PASSWORD';

-- Create databases
CREATE DATABASE dtvisuals_prod OWNER dtvisuals;
CREATE DATABASE dtvisuals_dev OWNER dtvisuals;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE dtvisuals_prod TO dtvisuals;
GRANT ALL PRIVILEGES ON DATABASE dtvisuals_dev TO dtvisuals;

-- Show databases
\l
EOF

# Configure PostgreSQL
echo "⚙️  Configuring PostgreSQL..."
PG_VERSION=$(psql --version | grep -oP '\d+\.\d+' | head -1)
PG_MAJOR=$(echo $PG_VERSION | cut -d. -f1)

# Update postgresql.conf for better performance
cat >> /etc/postgresql/$PG_MAJOR/main/postgresql.conf << EOF

# DT Visuals Performance Settings
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
EOF

# Restart PostgreSQL
systemctl restart postgresql

# Setup firewall
echo "🔥 Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

# Configure fail2ban
echo "🛡️  Configuring fail2ban..."
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
EOF

systemctl restart fail2ban

# Create PM2 ecosystem file
echo "⚙️  Creating PM2 ecosystem configuration..."
sudo -u dtvisuals tee /var/www/dtvisuals/ecosystem.config.js > /dev/null << 'EOF'
module.exports = {
  apps: [
    {
      name: 'dtvisuals-prod',
      cwd: '/var/www/dtvisuals/app',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production'
      },
      env_file: '/var/www/dtvisuals/app/.env.prod',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1G',
      error_file: '/var/log/dtvisuals/prod-error.log',
      out_file: '/var/log/dtvisuals/prod-out.log',
      log_file: '/var/log/dtvisuals/prod-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'dtvisuals-dev',
      cwd: '/var/www/dtvisuals/app',
      script: 'npm',
      args: 'run dev:server',
      env: {
        NODE_ENV: 'development'
      },
      env_file: '/var/www/dtvisuals/app/.env.dev',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1G',
      error_file: '/var/log/dtvisuals/dev-error.log',
      out_file: '/var/log/dtvisuals/dev-out.log',
      log_file: '/var/log/dtvisuals/dev-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false
    }
  ]
};
EOF

# Create systemd service for PM2
echo "⚙️  Setting up PM2 systemd service..."
sudo -u dtvisuals pm2 startup systemd -u dtvisuals --hp /home/dtvisuals
# Note: This will output a command that needs to be run as root

# Create log rotation
echo "📝 Setting up log rotation..."
cat > /etc/logrotate.d/dtvisuals << EOF
/var/log/dtvisuals/*.log {
    daily
    rotate 14
    compress
    delaycompress
    copytruncate
    notifempty
    missingok
    su dtvisuals dtvisuals
}
EOF

# Create deployment script
echo "📜 Creating deployment helper script..."
cat > /usr/local/bin/dtvisuals-deploy << 'EOF'
#!/bin/bash

# DT Visuals Deployment Helper
# Usage: dtvisuals-deploy [prod|dev]

ENVIRONMENT=${1:-prod}
APP_DIR="/var/www/dtvisuals/app"

if [[ "$ENVIRONMENT" != "prod" && "$ENVIRONMENT" != "dev" ]]; then
    echo "Usage: dtvisuals-deploy [prod|dev]"
    exit 1
fi

echo "=== Deploying DT Visuals ($ENVIRONMENT) ==="

cd $APP_DIR

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production

# Set up environment files
echo "⚙️  Setting up environment files..."
./setup-env-server.sh

echo ""
echo "⚠️  IMPORTANT: Configure your environment files before running migrations!"
echo "   1. Edit .env.prod with your database password and session secret"
echo "   2. Edit .env.dev with your database password and session secret" 
echo "   3. Generate session secrets: openssl rand -hex 64"
echo ""
echo "🗃️  After configuring, run migrations with:"
echo "   ./run-migration-with-env.sh prod"
echo "   ./run-migration-with-env.sh dev"

# Build frontend
echo "🔨 Building frontend..."
npm run build

# Restart PM2 process
echo "🔄 Restarting application..."
sudo -u dtvisuals pm2 restart dtvisuals-$ENVIRONMENT

echo "✅ Deployment complete!"
EOF

chmod +x /usr/local/bin/dtvisuals-deploy

# Summary
echo ""
echo "=== Setup Complete! ==="
echo ""
echo "✅ Installed:"
echo "   - Node.js $(node --version)"
echo "   - PostgreSQL $PG_MAJOR"
echo "   - Nginx $(nginx -v 2>&1 | grep -o 'nginx/[0-9.]*')"
echo "   - PM2 $(pm2 --version)"
echo "   - Certbot $(certbot --version | head -1)"
echo ""
echo "📋 Next Steps:"
echo "1. Update PostgreSQL password: sudo -u postgres psql -c \"ALTER USER dtvisuals PASSWORD 'your-secure-password';\""
echo "2. Create .env files: cp .env.prod.template .env.prod && cp .env.dev.template .env.dev"
echo "3. Update environment variables in .env files"
echo "4. Deploy application code to /var/www/dtvisuals/app/"
echo "5. Run: dtvisuals-deploy prod"
echo "6. Setup SSL: certbot --nginx -d dtvisuals.com -d www.dtvisuals.com -d dev.dtvisuals.com"
echo "7. Copy nginx.conf to /etc/nginx/sites-available/dtvisuals"
echo "8. Enable site: ln -s /etc/nginx/sites-available/dtvisuals /etc/nginx/sites-enabled/"
echo "9. Test nginx: nginx -t && systemctl reload nginx"
echo ""
echo "🔐 Security Notes:"
echo "   - Change default PostgreSQL passwords"
echo "   - Generate secure SESSION_SECRET values"
echo "   - Configure DNS records for your domain"
echo "   - Review firewall settings"
echo ""
echo "📊 Monitoring:"
echo "   - PM2: pm2 status, pm2 logs"
echo "   - Nginx: tail -f /var/log/nginx/error.log"
echo "   - PostgreSQL: tail -f /var/log/postgresql/postgresql-$PG_MAJOR-main.log"
EOF

chmod +x server-setup.sh