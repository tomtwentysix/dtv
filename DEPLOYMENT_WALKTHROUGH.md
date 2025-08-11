# DT Visuals Deployment Walkthrough

## Prerequisites Checklist

Before deploying, ensure you have:

- [ ] Ubuntu 20.04/22.04 LTS server
- [ ] Domain name (dtvisuals.com) pointed to server IP
- [ ] SSH access to server
- [ ] GitHub repository with code

## Step 1: Initial Server Setup

### 1.1 Run Server Setup Script

```bash
# On your server as root
wget https://raw.githubusercontent.com/tomtwentysix/dtv/main/server-setup.sh
chmod +x server-setup.sh
sudo ./server-setup.sh
```

**What this installs:**
- Node.js 20 LTS
- PostgreSQL 15
- Nginx with security configuration
- PM2 process manager
- Certbot for SSL certificates
- Creates `dtvisuals` user and directory structure

### 1.2 Verify Installation

```bash
# Check services
systemctl status postgresql nginx
node --version
npm --version
sudo -u dtvisuals pm2 --version
```

## Step 2: Database Configuration

### 2.1 Set Secure Database Password

```bash
# Generate a secure password (save this!)
openssl rand -base64 32

# Set the password in PostgreSQL
sudo -u postgres psql -c "ALTER USER dtvisuals PASSWORD 'your-generated-password';"
```

### 2.2 Verify Databases

```bash
# List databases
sudo -u postgres psql -l | grep dtvisuals

# Should show:
# dtvisuals_prod | dtvisuals
# dtvisuals_dev  | dtvisuals
```

## Step 3: Application Setup

### 3.1 Clone Repository

```bash
cd /var/www/dtvisuals
sudo -u dtvisuals git clone https://github.com/tomtwentysix/dtv.git app
cd app
```

### 3.2 Create Environment Files

```bash
# Copy templates
sudo -u dtvisuals cp .env.prod.template .env.prod
sudo -u dtvisuals cp .env.dev.template .env.dev
```

### 3.3 Configure Environment Variables

Edit the production environment:
```bash
sudo -u dtvisuals nano .env.prod
```

**Required changes:**
```env
NODE_ENV=production
PORT=5001
DATABASE_URL=postgresql://dtvisuals:YOUR_SECURE_PASSWORD@localhost:5432/dtvisuals_prod
SESSION_SECRET=GENERATE_64_CHAR_RANDOM_STRING_HERE
DOMAIN=dtvisuals.com
```

Edit the development environment:
```bash
sudo -u dtvisuals nano .env.dev
```

**Required changes:**
```env
NODE_ENV=development
PORT=5002
DATABASE_URL=postgresql://dtvisuals:YOUR_SECURE_PASSWORD@localhost:5432/dtvisuals_dev
SESSION_SECRET=DIFFERENT_64_CHAR_RANDOM_STRING_HERE
DOMAIN=dev.dtvisuals.com
```

### 3.4 Generate Secure Session Secrets

```bash
# Generate secure session secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Use different secrets for prod and dev
```

## Step 4: DNS Configuration

Set these DNS records with your domain provider:

```
Type  Name                  TTL    Value
A     dtvisuals.com         300    YOUR_SERVER_IP
A     www.dtvisuals.com     300    YOUR_SERVER_IP
A     dev.dtvisuals.com     300    YOUR_SERVER_IP
```

**Wait for DNS propagation** (5-30 minutes):
```bash
# Test DNS resolution
nslookup dtvisuals.com
nslookup dev.dtvisuals.com
```

## Step 5: Initial Deployment

### 5.1 Build and Deploy Application

```bash
cd /var/www/dtvisuals/app

# Install dependencies
sudo -u dtvisuals npm ci --production

# Build application
sudo -u dtvisuals npm run build

# Run database migrations
sudo -u dtvisuals NODE_ENV=production npx drizzle-kit migrate
sudo -u dtvisuals NODE_ENV=development npx drizzle-kit migrate

# Start PM2 processes
sudo -u dtvisuals pm2 start ecosystem.config.js
sudo -u dtvisuals pm2 save
sudo -u dtvisuals pm2 startup
```

### 5.2 Verify Application is Running

```bash
# Check PM2 status
sudo -u dtvisuals pm2 status

# Test health endpoints
curl -I http://localhost:5001/api/health  # Production
curl -I http://localhost:5002/api/health  # Development
```

## Step 6: SSL Certificate Setup

### 6.1 Configure Nginx and Get SSL Certificates

```bash
# Run SSL setup script
sudo ./ssl-setup.sh dtvisuals.com,www.dtvisuals.com,dev.dtvisuals.com admin@dtvisuals.com
```

**This script will:**
- Stop nginx temporarily
- Obtain Let's Encrypt certificates
- Configure nginx with SSL
- Set up automatic renewal
- Start nginx with HTTPS

### 6.2 Verify SSL Setup

```bash
# Test SSL certificates
curl -I https://dtvisuals.com
curl -I https://dev.dtvisuals.com

# Check certificate status
sudo certbot certificates
```

## Step 7: GitHub Actions Setup (Automated Deployment)

### 7.1 Configure GitHub Secrets

In your GitHub repository, go to `Settings` → `Secrets and variables` → `Actions`:

```
SERVER_HOST = your_server_ip_address
SERVER_USER = root
SSH_PRIVATE_KEY = your_private_ssh_key_content
SERVER_PORT = 22
```

### 7.2 Test Automated Deployment

```bash
# Push to main branch triggers production deployment
git push origin main

# Push to dev branch triggers development deployment  
git push origin dev
```

## Step 8: Monitoring and Maintenance

### 8.1 Essential Commands

```bash
# Application monitoring
sudo -u dtvisuals pm2 status
sudo -u dtvisuals pm2 logs dtvisuals-prod
sudo -u dtvisuals pm2 logs dtvisuals-dev

# Restart applications
sudo -u dtvisuals pm2 restart dtvisuals-prod
sudo -u dtvisuals pm2 restart dtvisuals-dev

# Nginx management
sudo nginx -t                    # Test configuration
sudo systemctl status nginx     # Check status
sudo systemctl reload nginx     # Reload configuration

# Database management
sudo -u postgres psql dtvisuals_prod
sudo -u postgres psql dtvisuals_dev

# SSL certificate management
sudo certbot certificates        # Check status
sudo certbot renew             # Renew certificates
```

### 8.2 Log Locations

```bash
# Application logs
/var/log/dtvisuals/prod-*.log
/var/log/dtvisuals/dev-*.log

# System logs
/var/log/nginx/access.log
/var/log/nginx/error.log
/var/log/postgresql/postgresql-15-main.log
```

## Step 9: Backup Setup

### 9.1 Configure Automatic Backups

```bash
# The server setup already created backup script
sudo /usr/local/bin/dtvisuals-backup

# View backups
ls -la /var/backups/dtvisuals/
```

## Deployment Types

### Manual Deployment

```bash
# On server
cd /var/www/dtvisuals/app
sudo ./deploy.sh prod main    # Deploy production from main branch
sudo ./deploy.sh dev dev      # Deploy development from dev branch
```

### Automated Deployment (GitHub Actions)

- **Production**: Push/merge to `main` branch
- **Development**: Push to `dev` branch

## Troubleshooting

### Common Issues and Solutions

1. **502 Bad Gateway**
   ```bash
   sudo -u dtvisuals pm2 status
   sudo -u dtvisuals pm2 restart all
   ```

2. **SSL Certificate Errors**
   ```bash
   sudo certbot renew
   sudo systemctl restart nginx
   ```

3. **Database Connection Errors**
   ```bash
   systemctl status postgresql
   # Check .env file credentials
   ```

4. **Migration Errors**
   ```bash
   # Use the quick fix script
   sudo ./quick-migrate-fix.sh
   ```

## Post-Deployment Verification

### Final Checklist

- [ ] https://dtvisuals.com loads correctly
- [ ] https://dev.dtvisuals.com loads correctly
- [ ] SSL certificates are valid (no browser warnings)
- [ ] PM2 processes are running
- [ ] Database connections work
- [ ] File uploads work
- [ ] Admin login works
- [ ] Automatic certificate renewal is scheduled

### Performance Testing

```bash
# Test response times
curl -w "@curl-format.txt" -o /dev/null -s https://dtvisuals.com

# Monitor resource usage
htop
sudo -u dtvisuals pm2 monit
```

## Success! 

Your DT Visuals application is now deployed with:

- **Production**: https://dtvisuals.com
- **Development**: https://dev.dtvisuals.com
- **SSL**: Automatic Let's Encrypt certificates
- **Monitoring**: PM2 process management
- **Backups**: Automatic daily backups
- **CI/CD**: GitHub Actions deployment

## Next Steps

1. Test all functionality thoroughly
2. Monitor logs for any issues
3. Set up additional monitoring (optional)
4. Document any custom configurations
5. Train team on deployment process