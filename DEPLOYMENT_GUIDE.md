# DT Visuals Deployment Guide

## Overview

Clean, production-ready deployment system for DT Visuals with dual environments (prod/dev), automated SSL, and GitHub Actions CI/CD.

**Architecture:** Bare-metal Ubuntu server with Node.js + PM2 + Nginx + PostgreSQL

## Repository Setup

### 1. GitHub Secrets Configuration

Add these secrets to your GitHub repository (`Settings` → `Secrets and variables` → `Actions`):

```
SERVER_HOST=your-server-ip-address
SERVER_USER=root
SSH_PRIVATE_KEY=your-private-ssh-key
SERVER_PORT=22
```

### 2. Branch Structure

- `main` branch → Production deployment
- `dev` branch → Development deployment

## Server Setup

### 1. Initial Server Preparation

Run on a fresh Ubuntu 20.04/22.04 LTS server:

```bash
# Download and run server setup
wget https://raw.githubusercontent.com/tomtwentysix/dtv/main/server-setup.sh
chmod +x server-setup.sh
sudo ./server-setup.sh
```

This installs:
- Node.js 20 LTS
- PostgreSQL 15
- Nginx
- PM2 (process manager)
- Certbot (SSL certificates)
- Creates `dtvisuals` user and directory structure

### 2. Database Configuration

```bash
# Set secure database password
sudo -u postgres psql -c "ALTER USER dtvisuals PASSWORD 'your-secure-password';"

# Verify databases exist
sudo -u postgres psql -l | grep dtvisuals
```

### 3. Application Setup

```bash
# Clone repository to server
cd /var/www/dtvisuals
sudo -u dtvisuals git clone https://github.com/tomtwentysix/dtv.git app
cd app

# Create environment files
sudo -u dtvisuals cp .env.prod.template .env.prod
sudo -u dtvisuals cp .env.dev.template .env.dev

# Edit environment files with actual values
sudo -u dtvisuals nano .env.prod
sudo -u dtvisuals nano .env.dev
```

**Required .env changes:**
- Update `DATABASE_URL` with actual passwords
- Generate secure `SESSION_SECRET` values (64+ characters)
- Set correct domain names

### 4. Initial Deployment

```bash
# Install dependencies and build
cd /var/www/dtvisuals/app
sudo -u dtvisuals npm ci --production
sudo -u dtvisuals npm run build

# Run database migrations
sudo -u dtvisuals NODE_ENV=production npx drizzle-kit migrate
sudo -u dtvisuals NODE_ENV=development npx drizzle-kit migrate

# Start PM2 processes
sudo -u dtvisuals pm2 start ecosystem.config.js
sudo -u dtvisuals pm2 save
sudo -u dtvisuals pm2 startup
```

### 5. SSL Certificate Setup

```bash
# Point DNS records to your server first!
# A record: dtvisuals.com → server-ip
# A record: www.dtvisuals.com → server-ip  
# A record: dev.dtvisuals.com → server-ip

# Generate SSL certificates
sudo ./ssl-setup.sh dtvisuals.com,www.dtvisuals.com,dev.dtvisuals.com admin@dtvisuals.com
```

## DNS Configuration

Set these DNS records with your domain provider:

```
Type  Name                TTL    Value
A     dtvisuals.com       300    your-server-ip
A     www.dtvisuals.com   300    your-server-ip
A     dev.dtvisuals.com   300    your-server-ip
```

## Deployment Process

### Automatic Deployment (GitHub Actions)

1. **Production:** Push to `main` branch
2. **Development:** Push to `dev` branch

The workflow automatically:
- Builds the application
- Deploys to server via SSH
- Runs database migrations
- Restarts PM2 processes
- Performs health checks

### Manual Deployment

```bash
# On the server
cd /var/www/dtvisuals/app
sudo ./deploy.sh prod main    # Deploy production from main branch
sudo ./deploy.sh dev dev      # Deploy development from dev branch
```

## Environment Details

### Production Environment
- **URL:** https://dtvisuals.com
- **Port:** 5001 (internal)
- **Database:** dtvisuals_prod
- **PM2 Process:** dtvisuals-prod
- **Uploads:** /var/www/dtvisuals/uploads/prod/

### Development Environment  
- **URL:** https://dev.dtvisuals.com
- **Port:** 5002 (internal)
- **Database:** dtvisuals_dev
- **PM2 Process:** dtvisuals-dev
- **Uploads:** /var/www/dtvisuals/uploads/dev/

## Monitoring & Maintenance

### Application Monitoring
```bash
# Check application status
sudo -u dtvisuals pm2 status

# View logs
sudo -u dtvisuals pm2 logs dtvisuals-prod
sudo -u dtvisuals pm2 logs dtvisuals-dev

# Restart applications
sudo -u dtvisuals pm2 restart dtvisuals-prod
sudo -u dtvisuals pm2 restart dtvisuals-dev
```

### Database Monitoring
```bash
# Connect to databases
sudo -u postgres psql dtvisuals_prod
sudo -u postgres psql dtvisuals_dev

# Check database size
sudo -u postgres psql -c "SELECT pg_database.datname, pg_size_pretty(pg_database_size(pg_database.datname)) AS size FROM pg_database;"
```

### SSL Certificate Monitoring
```bash
# Check certificate status
sudo certbot certificates

# Test renewal (dry run)
sudo certbot renew --dry-run

# Force renewal if needed
sudo certbot renew --force-renewal
```

### Nginx Monitoring
```bash
# Check nginx status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# View error logs
sudo tail -f /var/log/nginx/error.log

# View access logs
sudo tail -f /var/log/nginx/access.log
```

## Troubleshooting

### Common Issues

1. **502 Bad Gateway**
   - Check if PM2 processes are running: `sudo -u dtvisuals pm2 status`
   - Check application logs: `sudo -u dtvisuals pm2 logs`
   - Restart applications: `sudo -u dtvisuals pm2 restart all`

2. **SSL Certificate Errors**
   - Check certificate expiry: `sudo certbot certificates`
   - Renew if needed: `sudo certbot renew`
   - Restart nginx: `sudo systemctl restart nginx`

3. **Database Connection Errors**
   - Check PostgreSQL status: `sudo systemctl status postgresql`
   - Verify credentials in .env files
   - Check database exists: `sudo -u postgres psql -l`

4. **File Upload Errors**
   - Check uploads directory permissions: `ls -la /var/www/dtvisuals/uploads/`
   - Fix permissions: `sudo chown -R dtvisuals:www-data /var/www/dtvisuals/uploads/`

### Log Locations

```bash
# Application logs
/var/log/dtvisuals/prod-*.log
/var/log/dtvisuals/dev-*.log

# PM2 logs
sudo -u dtvisuals pm2 logs

# Nginx logs  
/var/log/nginx/access.log
/var/log/nginx/error.log

# PostgreSQL logs
/var/log/postgresql/postgresql-15-main.log
```

## Security Considerations

### Firewall Configuration
```bash
# Check firewall status
sudo ufw status

# Allow only necessary ports
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Regular Security Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js packages (in app directory)
sudo -u dtvisuals npm audit fix
```

### Database Security
- Use strong passwords for database users
- Regularly backup databases
- Monitor for unusual connection attempts
- Keep PostgreSQL updated

## Backup & Recovery

See `ROLLBACK.md` for detailed backup and recovery procedures.

### Quick Backup
```bash
# Create backup
sudo /usr/local/bin/dtvisuals-backup

# View backups
ls -la /var/backups/dtvisuals/
```

## Performance Optimization

### PM2 Optimization
```bash
# Enable PM2 monitoring
sudo -u dtvisuals pm2 install pm2-server-monit

# Optimize PM2 configuration
sudo -u dtvisuals pm2 set pm2:autodump true
sudo -u dtvisuals pm2 set pm2:watch-delay 1000
```

### Database Optimization
```bash
# Analyze database performance
sudo -u postgres psql dtvisuals_prod -c "ANALYZE;"

# Update statistics
sudo -u postgres psql dtvisuals_prod -c "VACUUM ANALYZE;"
```

### Nginx Optimization
Already configured with:
- Gzip compression
- Static file caching
- Rate limiting
- Keep-alive connections

## Support

- **Repository:** https://github.com/tomtwentysix/dtv
- **Issues:** Create GitHub issues for bugs/features
- **Logs:** Check application and system logs for troubleshooting
- **Monitoring:** Use PM2 dashboard and server monitoring tools