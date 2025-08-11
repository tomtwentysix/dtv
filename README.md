# DT Visuals - Production Deployment System

> Clean, production-ready dual-environment deployment for cinematic media production company

## Quick Start

### For Production Deployment

1. **Server Setup** (Ubuntu 20.04/22.04):
   ```bash
   wget https://raw.githubusercontent.com/tomtwentysix/dtv/main/server-setup.sh
   sudo chmod +x server-setup.sh && sudo ./server-setup.sh
   ```

2. **Configure Environment**:
   ```bash
   cp .env.prod.template .env.prod
   cp .env.dev.template .env.dev
   # Edit files with actual database passwords and secrets
   ```

3. **Setup SSL**:
   ```bash
   sudo ./ssl-setup.sh dtvisuals.com,www.dtvisuals.com,dev.dtvisuals.com admin@dtvisuals.com
   ```

4. **Deploy**:
   ```bash
   ./deploy.sh prod main
   ```

### For GitHub Actions

Add repository secrets:
- `SERVER_HOST` - Server IP address
- `SERVER_USER` - SSH username (typically `root`)
- `SSH_PRIVATE_KEY` - Private SSH key
- `SERVER_PORT` - SSH port (default `22`)

Deploy by pushing to branches:
- `main` branch → Production deployment
- `dev` branch → Development deployment

## Architecture

**Stack:** React + TypeScript + Vite + Node.js + Express + PostgreSQL + PM2 + Nginx

**Environments:**
- **Production**: https://dtvisuals.com (port 5001 internal)
- **Development**: https://dev.dtvisuals.com (port 5002 internal)

**Key Features:**
- Automatic SSL certificates via Let's Encrypt
- Database migrations on each deployment
- PM2 process management with auto-restart
- Rate limiting and security headers
- Automatic backups and rollback procedures
- Comprehensive monitoring and logging

## File Structure

```
├── .env.prod.template          # Production environment template
├── .env.dev.template           # Development environment template
├── .github/workflows/deploy.yml # GitHub Actions deployment
├── ecosystem.config.js         # PM2 process configuration
├── nginx.conf                  # Nginx reverse proxy config
├── server-setup.sh            # Server installation script
├── ssl-setup.sh               # SSL certificate automation
├── deploy.sh                  # Manual deployment script
├── DEPLOYMENT_GUIDE.md        # Complete deployment guide
├── ROLLBACK.md                # Emergency rollback procedures
└── README.md                  # This file
```

## URLs

- **Production**: https://dtvisuals.com
- **Development**: https://dev.dtvisuals.com
- **Repository**: https://github.com/tomtwentysix/dtv

## Support

- **Setup Issues**: See `DEPLOYMENT_GUIDE.md`
- **Problems**: See `ROLLBACK.md`
- **Monitoring**: Use PM2 dashboard and server logs

---

**Built with simplicity and reliability in mind** ✨