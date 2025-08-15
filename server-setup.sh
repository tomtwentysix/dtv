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

# Generate a secure password for the database user
DB_PASSWORD=$(openssl rand -base64 32)
echo "📝 Generated secure database password: $DB_PASSWORD"
echo "🔐 IMPORTANT: Save this password - you'll need it for .env files!"
echo "$DB_PASSWORD" > /tmp/dtvisuals_db_password.txt
chmod 600 /tmp/dtvisuals_db_password.txt

sudo -u postgres psql << EOF
-- Create dtvisuals user with secure password
CREATE USER dtvisuals WITH PASSWORD '$DB_PASSWORD';

-- Create databases
CREATE DATABASE dtvisuals_prod OWNER dtvisuals;
CREATE DATABASE dtvisuals_dev OWNER dtvisuals;

-- Grant all privileges on databases
GRANT ALL PRIVILEGES ON DATABASE dtvisuals_prod TO dtvisuals;
GRANT ALL PRIVILEGES ON DATABASE dtvisuals_dev TO dtvisuals;

-- Grant additional schema privileges
\c dtvisuals_prod
GRANT ALL ON SCHEMA public TO dtvisuals;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dtvisuals;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dtvisuals;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO dtvisuals;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO dtvisuals;

\c dtvisuals_dev
GRANT ALL ON SCHEMA public TO dtvisuals;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dtvisuals;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dtvisuals;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO dtvisuals;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO dtvisuals;

-- Show databases to verify creation
\l
EOF

echo ""
echo "✅ PostgreSQL setup complete!"
echo "📋 Database Information:"
echo "   Username: dtvisuals"
echo "   Password: $DB_PASSWORD"
echo "   Production Database: dtvisuals_prod"
echo "   Development Database: dtvisuals_dev"
echo "   Password saved to: /tmp/dtvisuals_db_password.txt"
echo ""

# Test database connections
echo "🔍 Testing database connections..."
if sudo -u postgres psql -d dtvisuals_prod -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ Production database connection: SUCCESS"
else
    echo "❌ Production database connection: FAILED"
fi

if sudo -u postgres psql -d dtvisuals_dev -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ Development database connection: SUCCESS"
else
    echo "❌ Development database connection: FAILED"
fi

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

# Initial deployment setup complete
echo ""
echo "✅ Server setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Set up DNS: Point dtvisuals.com and dev.dtvisuals.com to this server"
echo "   2. Deploy: sudo ./deploy.sh prod main"
echo "   3. Configure environment files when prompted"
echo "   4. Set up SSL: sudo ./ssl-setup.sh dtvisuals.com,dev.dtvisuals.com admin@domain.com"

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
echo "1. Clone your application:"
echo "   cd /var/www/dtvisuals"
echo "   sudo -u dtvisuals git clone https://github.com/your-username/your-repo.git app"
echo "   cd app"
echo ""
echo "2. Create environment files using the generated password:"
echo "   cp .env.prod.template .env.prod"
echo "   cp .env.dev.template .env.dev"
echo "   # Replace CHANGE_PASSWORD with: $(cat /tmp/dtvisuals_db_password.txt 2>/dev/null || echo 'Check /tmp/dtvisuals_db_password.txt')"
echo ""
echo "3. Deploy your application:"
echo "   sudo ./deploy.sh prod main"
echo ""
echo "4. Setup SSL certificates:"
echo "   sudo ./ssl-setup.sh yourdomain.com,www.yourdomain.com,dev.yourdomain.com admin@yourdomain.com"
echo ""
echo "5. Configure Nginx (if needed):"
echo "   sudo cp nginx.conf /etc/nginx/sites-available/dtvisuals"
echo "   sudo ln -sf /etc/nginx/sites-available/dtvisuals /etc/nginx/sites-enabled/"
echo "   sudo rm -f /etc/nginx/sites-enabled/default"
echo "   sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "🔐 Security Information:"
echo "   Database password: $(cat /tmp/dtvisuals_db_password.txt 2>/dev/null || echo 'Check /tmp/dtvisuals_db_password.txt')"
echo "   Password file: /tmp/dtvisuals_db_password.txt"
echo "   Remember to:"
echo "   - Update SESSION_SECRET in .env files with secure random strings"
echo "   - Configure DNS records for your domain"
echo "   - Review firewall settings (UFW is enabled)"
echo ""
echo "📊 Troubleshooting & Monitoring:"
echo "   - Application logs: sudo -u dtvisuals pm2 logs"
echo "   - Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "   - PostgreSQL logs: sudo tail -f /var/log/postgresql/postgresql-$PG_MAJOR-main.log"
echo "   - Database connection test: sudo -u dtvisuals psql -U dtvisuals -d dtvisuals_prod -h localhost"
echo "   - Check disk space: df -h"
echo "   - Check uploads directories: ls -la /var/www/dtvisuals/uploads/"
EOF

chmod +x server-setup.sh