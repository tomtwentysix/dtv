# DT Visuals Deployment Guide

## Prerequisites

- Ubuntu 20.04/22.04 LTS server
- Domain name pointed to server IP  
- SSH access to server
- GitHub repository with code

## Installation

Run the server setup script:
```bash
sudo ./server-setup.sh
```

This installs Node.js, PostgreSQL, Nginx, PM2, Certbot and creates the dtvisuals user.

## DNS Setup

Point your domain to the server:
```
dtvisuals.com → YOUR_SERVER_IP
dev.dtvisuals.com → YOUR_SERVER_IP
```

## Deployment

Clone and deploy:
```bash
cd /var/www/dtvisuals
sudo -u dtvisuals git clone https://github.com/tomtwentysix/dtv.git app
cd app

# Deploy production
sudo ./deploy.sh prod main

# Deploy development  
sudo ./deploy.sh dev dev
```

The deploy script will:
1. Pull latest code from specified branch
2. Install dependencies and build
3. Create environment files (if missing) - **you must configure these**
4. Run database migrations
5. Start/restart PM2 processes

## Environment Configuration

When first deploying, the script creates template environment files that need configuration:

**Edit .env.prod:**
```bash
sudo -u dtvisuals nano .env.prod
```
Update DATABASE_URL password and SESSION_SECRET (generate with `openssl rand -hex 64`)

**Edit .env.dev:**  
```bash
sudo -u dtvisuals nano .env.dev
```
Update DATABASE_URL password and SESSION_SECRET

## SSL Setup

Get SSL certificates:
```bash
sudo ./ssl-setup.sh dtvisuals.com,dev.dtvisuals.com admin@dtvisuals.com
```

## GitHub Actions (Optional)

Add secrets to GitHub repo settings:
- SERVER_HOST (your server IP)
- SERVER_USER (root) 
- SSH_PRIVATE_KEY (your private key)

Then pushes to main/dev branches auto-deploy.

## Management

```bash
# Check status
sudo -u dtvisuals pm2 status

# View logs  
sudo -u dtvisuals pm2 logs dtvisuals-prod
sudo -u dtvisuals pm2 logs dtvisuals-dev

# Restart
sudo -u dtvisuals pm2 restart dtvisuals-prod
sudo -u dtvisuals pm2 restart dtvisuals-dev

# Test applications
curl -I https://dtvisuals.com
curl -I https://dev.dtvisuals.com
```

## Database Management

```bash
# Set database password
sudo -u postgres psql -c "ALTER USER dtvisuals PASSWORD 'your-password';"

# Access databases
sudo -u postgres psql dtvisuals_prod
sudo -u postgres psql dtvisuals_dev
```