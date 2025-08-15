# DT Visuals

> Production-ready media management system for cinematic production companies

**Clean, reliable deployment with PostgreSQL database and GitHub Actions automation**

## Features

- **Media Management**: Upload, organize, and share media with clients
- **Client Portal**: Secure client access with feedback capabilities  
- **Role-Based Access**: Admin, staff, and client user management
- **Dual Environments**: Separate production and development deployments
- **Auto SSL**: Let's Encrypt integration with automatic renewal
- **Database Migrations**: Automated schema updates on deployment

## Quick Deployment

### For Production (Ubuntu Server)

```bash
# 1. Server setup (one-time)
wget https://raw.githubusercontent.com/tomtwentysix/dtv/main/server-setup.sh
sudo chmod +x server-setup.sh && sudo ./server-setup.sh
# ✅ This creates PostgreSQL with secure auto-generated password
# ✅ Creates all required directories including persistent uploads folders

# 2. Clone and configure
cd /var/www/dtvisuals
sudo -u dtvisuals git clone https://github.com/tomtwentysix/dtv.git app
cd app

# 3. Verify setup
sudo ./verify-setup.sh

# 4. Configure environment (automated)
sudo ./setup-env.sh
# ✅ This uses the auto-generated database password
# ✅ Creates secure session secrets
# ✅ Configures upload directories properly

# 5. Setup SSL
sudo ./ssl-setup.sh yourdomain.com,www.yourdomain.com,dev.yourdomain.com admin@yourdomain.com

# 6. Deploy
sudo ./deploy.sh prod main
# ✅ Ensures upload directories are created and persistent
```

### For GitHub Actions Automation

1. **Configure Repository Secrets**:
   - `SERVER_HOST`: Your server IP
   - `SERVER_USER`: `dtvisuals`  
   - `SSH_PRIVATE_KEY`: SSH private key content
   - `SERVER_PORT`: `22`

2. **Deploy**: Push to `main` for production, `dev` for development

## Architecture

**Stack**: React + TypeScript + Vite + Node.js + Express + PostgreSQL + PM2 + Nginx

**Environments**:
- **Production**: Port 5001 → https://yourdomain.com
- **Development**: Port 5002 → https://dev.yourdomain.com

**Database**: PostgreSQL with automatic initialization:
- **Production**: Admin user created (`admin@dtvisuals.com` / `admin123`)
- **Development**: Admin + test users and sample data

## Default Users

After deployment, log in with:

**Production**:
- Admin: `admin@dtvisuals.com` / `admin123`

**Development** (includes production users plus):
- Staff: `staff@dtvisuals.com` / `admin123`
- Client: `demo@client.com` / `admin123`

⚠️ **Change default passwords immediately after first login**

## Management Commands

```bash
# Application status
sudo -u dtvisuals pm2 list

# View logs
sudo -u dtvisuals pm2 logs dtvisuals-prod

# Manual deployment
cd /var/www/dtvisuals/app
sudo -u dtvisuals git pull origin main
sudo -u dtvisuals npm ci --production
sudo -u dtvisuals npm run build
sudo -u dtvisuals npm run db:push
sudo -u dtvisuals pm2 restart dtvisuals-prod

# Health check
curl http://localhost:5001/api/health
```

## File Structure

```
├── .env.prod.template          # Production environment template
├── .env.dev.template           # Development environment template
├── .github/workflows/deploy.yml # GitHub Actions deployment
├── ecosystem.config.js         # PM2 process configuration
├── nginx.conf                  # Nginx reverse proxy config
├── server-setup.sh            # Server installation script
├── deploy.sh                  # Manual deployment script  
├── ssl-setup.sh               # SSL certificate automation
├── setup-env.sh               # Environment configuration helper
├── verify-setup.sh            # Setup verification script
├── DEPLOYMENT_GUIDE.md        # Complete deployment guide
└── README.md                  # This file
```

### Key Features Added

- **🔧 Automated PostgreSQL Setup**: Generates secure passwords automatically
- **📁 Persistent Upload Directories**: Uploads survive deployments in `/var/www/dtvisuals/uploads/{prod,dev}`
- **⚙️  Environment Configuration**: `setup-env.sh` automates .env file creation with secure defaults
- **✅ Setup Verification**: `verify-setup.sh` validates your installation
- **🔒 Security**: Proper permissions, secure passwords, and session secrets

## Documentation

- **[Deployment Guide](DEPLOYMENT_GUIDE.md)**: Complete setup and deployment instructions
- **[Rollback Procedures](ROLLBACK.md)**: Emergency recovery procedures

## Support

- **Setup Issues**: See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Problems**: See [ROLLBACK.md](ROLLBACK.md) 
- **Monitoring**: Use `pm2 monit` and server logs

---

**Built for reliability and simplicity** ✨