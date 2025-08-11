# DT Visuals Complete Deployment Guide

## Prerequisites

Before starting, ensure you have:

- **Ubuntu 20.04/22.04 LTS server** with root access
- **Domain name** (dtvisuals.com) pointed to your server IP
- **SSH key pair** for secure access
- **GitHub repository** with your code

## Step 1: Initial Server Setup

### 1.1 Prepare Server

Connect to your server and download the setup script:

```bash
# Connect to server
ssh root@your-server-ip

# Download and run server setup
wget https://raw.githubusercontent.com/tomtwentysix/dtv/main/server-setup.sh
chmod +x server-setup.sh
sudo ./server-setup.sh
```

### 1.2 What Server Setup Installs

The server-setup.sh script automatically installs and configures:

- **Node.js 20 LTS** - JavaScript runtime for the application
- **PostgreSQL 15** - Database server with two databases (prod/dev)
- **Nginx** - Web server and reverse proxy with security headers
- **PM2** - Process manager for Node.js applications
- **Certbot** - Let's Encrypt SSL certificate automation
- **Security tools** - UFW firewall, fail2ban intrusion prevention
- **System user** - Creates 'dtvisuals' user with proper permissions

### 1.3 Verify Installation

Check that all services are running properly:

```bash
# Check system services
systemctl status postgresql nginx

# Check Node.js and PM2
node --version    # Should show v20.x.x
npm --version
sudo -u dtvisuals pm2 --version

# Check databases were created
sudo -u postgres psql -l | grep dtvisuals
# Should show: dtvisuals_prod and dtvisuals_dev
```

## Step 2: DNS Configuration

### 2.1 Set DNS Records

Configure these DNS A records with your domain provider:

```
Record Type | Name                | TTL | Value
A          | dtvisuals.com       | 300 | YOUR_SERVER_IP
A          | www.dtvisuals.com   | 300 | YOUR_SERVER_IP  
A          | dev.dtvisuals.com   | 300 | YOUR_SERVER_IP
```

### 2.2 Verify DNS Propagation

Wait 5-30 minutes for DNS to propagate, then test:

```bash
# Test DNS resolution
nslookup dtvisuals.com
nslookup dev.dtvisuals.com

# Should return your server IP
dig +short dtvisuals.com
dig +short dev.dtvisuals.com
```

## Step 3: Database Configuration

### 3.1 Set Secure Database Password

Generate and set a secure password for the dtvisuals database user:

```bash
# Generate a random 32-character password
DB_PASSWORD=$(openssl rand -base64 32)
echo "Database password: $DB_PASSWORD"
# SAVE THIS PASSWORD - you'll need it for environment files

# Set the password in PostgreSQL
sudo -u postgres psql -c "ALTER USER dtvisuals PASSWORD '$DB_PASSWORD';"

# Test database connection
sudo -u postgres psql dtvisuals_prod -c "SELECT version();"
sudo -u postgres psql dtvisuals_dev -c "SELECT version();"
```

### 3.2 Verify Database Setup

```bash
# List databases and verify ownership
sudo -u postgres psql -l | grep dtvisuals

# Should show:
# dtvisuals_prod | dtvisuals | UTF8
# dtvisuals_dev  | dtvisuals | UTF8
```

## Step 4: Application Deployment

### 4.1 Clone Repository

```bash
# Navigate to web directory
cd /var/www/dtvisuals

# Clone your repository (replace with your repo URL)
sudo -u dtvisuals git clone https://github.com/tomtwentysix/dtv.git app

# Navigate to application directory
cd app

# Verify files are present
ls -la
# Should show package.json, server/, client/, etc.
```

### 4.2 First-Time Production Deployment

```bash
# Deploy production environment
sudo ./deploy.sh prod main
```

**What happens on first run:**
1. The script detects missing .env.prod file
2. Creates template environment file with placeholder values
3. Stops and prompts you to configure it
4. You must edit the file before deployment can continue

### 4.3 Configure Production Environment

Edit the production environment file:

```bash
sudo -u dtvisuals nano .env.prod
```

Update these critical values:

```env
NODE_ENV=production
PORT=5001
HOST=0.0.0.0
DATABASE_URL=postgresql://dtvisuals:YOUR_DB_PASSWORD@localhost:5432/dtvisuals_prod
SESSION_SECRET=YOUR_64_CHAR_RANDOM_STRING
ENABLE_TIMELINE=true
DEBUG=false
DOMAIN=dtvisuals.com
```

**Generate session secret:**
```bash
# Generate 64-character random string
openssl rand -hex 64
# Copy this value to SESSION_SECRET in .env.prod
```

### 4.4 Complete Production Deployment

After configuring .env.prod, run deploy again:

```bash
sudo ./deploy.sh prod main
```

Now the script will:
1. Pull latest code from main branch
2. Install production dependencies
3. Build the application
4. Load environment variables from .env.prod
5. Run database migrations
6. Start PM2 process for production

### 4.5 Deploy Development Environment

```bash
# Deploy development environment
sudo ./deploy.sh dev dev

# Configure development environment when prompted
sudo -u dtvisuals nano .env.dev
```

Development environment settings:

```env
NODE_ENV=development
PORT=5002
HOST=0.0.0.0
DATABASE_URL=postgresql://dtvisuals:YOUR_DB_PASSWORD@localhost:5432/dtvisuals_dev
SESSION_SECRET=DIFFERENT_64_CHAR_RANDOM_STRING
ENABLE_TIMELINE=true
DEBUG=true
DOMAIN=dev.dtvisuals.com
```

Complete development deployment:

```bash
sudo ./deploy.sh dev dev
```

## Step 5: Verify Applications

### 5.1 Check PM2 Status

```bash
# View all PM2 processes
sudo -u dtvisuals pm2 status

# Should show:
# │ Name            │ status │ cpu │ memory │
# │ dtvisuals-prod  │ online │ 0%  │ 45.2mb │
# │ dtvisuals-dev   │ online │ 0%  │ 42.1mb │
```

### 5.2 Test Application Health

```bash
# Test production application
curl -I http://localhost:5001/api/health
# Should return: HTTP/1.1 200 OK

# Test development application  
curl -I http://localhost:5002/api/health
# Should return: HTTP/1.1 200 OK

# View detailed response
curl http://localhost:5001/api/health
# Should return: {"status":"healthy","timestamp":"..."}
```

### 5.3 Check Application Logs

```bash
# View production logs
sudo -u dtvisuals pm2 logs dtvisuals-prod --lines 20

# View development logs
sudo -u dtvisuals pm2 logs dtvisuals-dev --lines 20

# Monitor logs in real-time
sudo -u dtvisuals pm2 logs dtvisuals-prod
```

## Step 6: SSL Certificate Setup

### 6.1 Install SSL Certificates

Run the SSL setup script with your domains:

```bash
# Install SSL certificates for all domains
sudo ./ssl-setup.sh dtvisuals.com,www.dtvisuals.com,dev.dtvisuals.com admin@dtvisuals.com
```

**What this script does:**
1. Stops Nginx temporarily
2. Uses Certbot to obtain Let's Encrypt certificates
3. Configures Nginx with SSL settings and security headers
4. Sets up automatic certificate renewal
5. Starts Nginx with HTTPS enabled

### 6.2 Verify SSL Setup

```bash
# Test HTTPS connections
curl -I https://dtvisuals.com
curl -I https://dev.dtvisuals.com
# Should return: HTTP/2 200 with SSL headers

# Check certificate details
sudo certbot certificates

# Test automatic renewal
sudo certbot renew --dry-run
```

### 6.3 Verify Nginx Configuration

```bash
# Test Nginx configuration
sudo nginx -t
# Should return: syntax is ok, test is successful

# Check Nginx status
systemctl status nginx
# Should show: active (running)

# View Nginx access logs
sudo tail -f /var/log/nginx/access.log
```

## Step 7: GitHub Actions Setup (Optional)

### 7.1 Configure Repository Secrets

In your GitHub repository, navigate to:
**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

```
SECRET_NAME       | VALUE
------------------|------------------------------------------
SERVER_HOST       | your_server_ip_address
SERVER_USER       | root
SSH_PRIVATE_KEY   | contents_of_your_private_ssh_key
SERVER_PORT       | 22
```

**To get your private SSH key content:**
```bash
# On your local machine
cat ~/.ssh/id_rsa
# Copy entire content including BEGIN/END lines
```

### 7.2 Test Automated Deployment

```bash
# Test production deployment
git push origin main
# Check GitHub Actions tab for deployment status

# Test development deployment
git push origin dev
# Check GitHub Actions tab for deployment status
```

### 7.3 Monitor GitHub Actions

Watch deployments in real-time:
1. Go to your repository on GitHub
2. Click **Actions** tab
3. View deployment workflow runs
4. Click on individual runs to see detailed logs

## Step 8: Database Management

### 8.1 Database Access

```bash
# Connect to production database
sudo -u postgres psql dtvisuals_prod

# Connect to development database
sudo -u postgres psql dtvisuals_dev

# List all databases
sudo -u postgres psql -l

# Check database sizes
sudo -u postgres psql -c "SELECT pg_database.datname, pg_size_pretty(pg_database_size(pg_database.datname)) AS size FROM pg_database WHERE datname LIKE 'dtvisuals%';"
```

### 8.2 Database Backup

The server setup creates an automatic backup script:

```bash
# Manual backup
sudo /usr/local/bin/dtvisuals-backup

# View existing backups
ls -la /var/backups/dtvisuals/

# Restore from backup (if needed)
sudo -u postgres pg_restore -d dtvisuals_prod /var/backups/dtvisuals/backup-file.dump
```

## Step 9: Application Management

### 9.1 PM2 Process Management

```bash
# View process status
sudo -u dtvisuals pm2 status

# Restart specific application
sudo -u dtvisuals pm2 restart dtvisuals-prod
sudo -u dtvisuals pm2 restart dtvisuals-dev

# Restart all applications
sudo -u dtvisuals pm2 restart all

# Stop applications
sudo -u dtvisuals pm2 stop dtvisuals-prod
sudo -u dtvisuals pm2 stop dtvisuals-dev

# Start applications
sudo -u dtvisuals pm2 start dtvisuals-prod
sudo -u dtvisuals pm2 start dtvisuals-dev

# Save PM2 configuration
sudo -u dtvisuals pm2 save

# Setup PM2 to start on boot
sudo -u dtvisuals pm2 startup
```

### 9.2 View Application Logs

```bash
# View recent logs
sudo -u dtvisuals pm2 logs dtvisuals-prod --lines 50
sudo -u dtvisuals pm2 logs dtvisuals-dev --lines 50

# Monitor logs in real-time
sudo -u dtvisuals pm2 logs dtvisuals-prod

# View error logs only
sudo -u dtvisuals pm2 logs dtvisuals-prod --err

# Clear logs
sudo -u dtvisuals pm2 flush
```

### 9.3 Resource Monitoring

```bash
# Monitor CPU and memory usage
sudo -u dtvisuals pm2 monit

# System resource usage
htop

# Disk usage
df -h
du -sh /var/www/dtvisuals/

# Check application ports
netstat -tlnp | grep -E "(5001|5002)"
```

## Step 10: Ongoing Deployment

### 10.1 Manual Deployment

For ongoing updates, use the deploy script:

```bash
# Deploy to production from main branch
sudo ./deploy.sh prod main

# Deploy to development from dev branch  
sudo ./deploy.sh dev dev

# Deploy specific branch to environment
sudo ./deploy.sh prod feature-branch-name
```

### 10.2 Deployment Process

Each deployment automatically:

1. **Pulls latest code** from specified Git branch
2. **Installs dependencies** with npm ci --production
3. **Builds application** with npm run build
4. **Loads environment** variables from .env file
5. **Runs database migrations** with drizzle-kit migrate
6. **Restarts PM2 process** with zero-downtime reload
7. **Verifies health** of the deployed application

### 10.3 Rollback Procedure

If deployment fails or issues occur:

```bash
# Quick rollback to previous Git commit
cd /var/www/dtvisuals/app
git log --oneline -5  # See recent commits
git reset --hard PREVIOUS_COMMIT_HASH
sudo ./deploy.sh prod main

# Restart applications
sudo -u dtvisuals pm2 restart all

# Check application status
sudo -u dtvisuals pm2 status
curl -I https://dtvisuals.com
```

## Step 11: Troubleshooting

### 11.1 Common Issues

**502 Bad Gateway:**
```bash
# Check PM2 status
sudo -u dtvisuals pm2 status
sudo -u dtvisuals pm2 logs dtvisuals-prod

# Restart application
sudo -u dtvisuals pm2 restart dtvisuals-prod
```

**Database Connection Errors:**
```bash
# Check PostgreSQL status
systemctl status postgresql

# Test database connection
sudo -u postgres psql dtvisuals_prod -c "SELECT 1;"

# Check environment file
sudo -u dtvisuals cat .env.prod | grep DATABASE_URL
```

**SSL Certificate Issues:**
```bash
# Check certificate status
sudo certbot certificates

# Renew certificates manually
sudo certbot renew

# Restart Nginx
sudo systemctl restart nginx
```

**Environment File Issues:**
```bash
# Verify environment file exists and has correct content
ls -la .env.prod .env.dev
sudo -u dtvisuals cat .env.prod

# Fix permissions if needed
sudo chown dtvisuals:dtvisuals .env.prod .env.dev
sudo chmod 600 .env.prod .env.dev
```

### 11.2 Log Locations

Important log files for troubleshooting:

```bash
# Application logs (via PM2)
sudo -u dtvisuals pm2 logs

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# System logs
sudo journalctl -f -u nginx
sudo journalctl -f -u postgresql
```

## Step 12: Security and Maintenance

### 12.1 Security Best Practices

The deployment includes these security measures:

- **UFW Firewall** - Only allows SSH, HTTP, and HTTPS
- **Fail2Ban** - Prevents brute force attacks
- **SSL/TLS** - All traffic encrypted with Let's Encrypt certificates
- **Security Headers** - Nginx configured with security headers
- **User Isolation** - Application runs under dedicated dtvisuals user
- **File Permissions** - Environment files protected with 600 permissions

### 12.2 Regular Maintenance

```bash
# Update system packages
sudo apt update && sudo apt upgrade

# Update Node.js packages
cd /var/www/dtvisuals/app
sudo -u dtvisuals npm update

# Check SSL certificate expiration
sudo certbot certificates

# Monitor disk space
df -h

# Check for security updates
sudo unattended-upgrades --dry-run
```

## Success!

Your DT Visuals application is now successfully deployed with:

- ✅ **Production environment**: https://dtvisuals.com
- ✅ **Development environment**: https://dev.dtvisuals.com
- ✅ **SSL certificates**: Automatic Let's Encrypt with renewal
- ✅ **Process management**: PM2 with auto-restart
- ✅ **Database**: PostgreSQL with separate prod/dev databases
- ✅ **Automated deployment**: GitHub Actions (optional)
- ✅ **Security**: Firewall, SSL, and security headers
- ✅ **Monitoring**: Comprehensive logging and health checks

The deployment system is production-ready and fully automated for ongoing updates.