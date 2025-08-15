# DT Visuals Deployment Guide

> Streamlined deployment for DT Visuals using GitHub Actions with manual deployment fallback

## Prerequisites

- Ubuntu 20.04/22.04 LTS server with root access
- Domain name pointed to your server IP
- PostgreSQL database (local or cloud)
- GitHub repository with deployment secrets configured

## Quick Start

### 1. Server Setup (One-time)

```bash
# Connect to server
ssh root@your-server-ip

# Download and run server setup
wget https://raw.githubusercontent.com/tomtwentysix/dtv/main/server-setup.sh
chmod +x server-setup.sh
sudo ./server-setup.sh
```

This installs Node.js, PostgreSQL, PM2, Nginx, and creates necessary users.

### 2. Database Setup

The server setup script automatically:
- Installs PostgreSQL 15
- Creates `dtvisuals` user with a secure auto-generated password
- Creates `dtvisuals_prod` and `dtvisuals_dev` databases
- Sets up proper permissions and schema access
- Tests database connections

**Important:** The database password is saved to `/tmp/dtvisuals_db_password.txt` - you'll need this for your environment files.

To verify your database setup:
```bash
# Check the generated password
cat /tmp/dtvisuals_db_password.txt

# Test database connections
sudo -u dtvisuals psql -U dtvisuals -d dtvisuals_prod -h localhost
sudo -u dtvisuals psql -U dtvisuals -d dtvisuals_dev -h localhost

# List databases
sudo -u postgres psql -l | grep dtvisuals
```

### 2.1. Manual PostgreSQL Troubleshooting

If you need to reset or troubleshoot PostgreSQL:

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL if needed
sudo systemctl restart postgresql

# Reset user password if needed
sudo -u postgres psql -c "ALTER USER dtvisuals PASSWORD 'your-new-password';"

# Check database permissions
sudo -u postgres psql -c "SELECT datname, datdba FROM pg_database WHERE datname LIKE 'dtvisuals%';"

# Check user permissions
sudo -u postgres psql -c "SELECT rolname, rolsuper, rolcreatedb, rolcanlogin FROM pg_roles WHERE rolname = 'dtvisuals';"
```

### 2.2. Directory Structure & Uploads

The server setup automatically creates the following directory structure:

```
/var/www/dtvisuals/
├── app/                    # Application code (git repository)
├── uploads/
│   ├── prod/              # Production uploads (persistent)
│   └── dev/               # Development uploads (persistent)
└── ecosystem.config.js    # PM2 configuration
```

**Upload Directory Configuration:**
- Production uploads: `/var/www/dtvisuals/uploads/prod`
- Development uploads: `/var/www/dtvisuals/uploads/dev`
- The application automatically uses `UPLOADS_DIR` environment variable
- Files uploaded remain persistent across deployments
- Proper permissions are set automatically (dtvisuals:www-data, 755)

To verify upload directories:
```bash
# Check directory structure
ls -la /var/www/dtvisuals/
ls -la /var/www/dtvisuals/uploads/

# Check permissions
ls -ld /var/www/dtvisuals/uploads/*

# Test upload directory access
sudo -u dtvisuals touch /var/www/dtvisuals/uploads/prod/test.txt
sudo -u dtvisuals rm /var/www/dtvisuals/uploads/prod/test.txt
```

### 3. Environment Configuration

Create production and development environment files:

```bash
cd /var/www/dtvisuals/app

# Get the auto-generated database password
DB_PASSWORD=$(cat /tmp/dtvisuals_db_password.txt)
echo "Database password: $DB_PASSWORD"

# Production environment
sudo -u dtvisuals cp .env.prod.template .env.prod
sudo -u dtvisuals nano .env.prod
```

Update `.env.prod` with the generated password:
```env
NODE_ENV=production
PORT=5001
DATABASE_URL=postgresql://dtvisuals:REPLACE_WITH_GENERATED_PASSWORD@localhost:5432/dtvisuals_prod
SESSION_SECRET=GENERATE_64_CHAR_RANDOM_STRING
DOMAIN=yourdomain.com
UPLOADS_DIR=/var/www/dtvisuals/uploads/prod
```

```bash
# Development environment
sudo -u dtvisuals cp .env.dev.template .env.dev
sudo -u dtvisuals nano .env.dev
```

Update `.env.dev` with the same database password:
```env
NODE_ENV=development
PORT=5002
DATABASE_URL=postgresql://dtvisuals:REPLACE_WITH_GENERATED_PASSWORD@localhost:5432/dtvisuals_dev
SESSION_SECRET=GENERATE_64_CHAR_RANDOM_STRING
DOMAIN=dev.yourdomain.com
UPLOADS_DIR=/var/www/dtvisuals/uploads/dev
NODE_ENV=development
PORT=5002
DATABASE_URL=postgresql://dtvisuals:your-secure-password@localhost:5432/dtvisuals_dev
SESSION_SECRET=your-64-char-random-string
DOMAIN=dev.yourdomain.com
```

### 4. SSL Setup

```bash
sudo ./ssl-setup.sh yourdomain.com,www.yourdomain.com,dev.yourdomain.com admin@yourdomain.com
```

## Deployment Methods

### Option A: GitHub Actions (Recommended)

#### Setup GitHub Secrets

In your GitHub repository, add these secrets under Settings > Secrets and variables > Actions:

- `SERVER_HOST`: Your server IP address
- `SERVER_USER`: `dtvisuals`
- `SSH_PRIVATE_KEY`: Your SSH private key content
- `SERVER_PORT`: `22` (or your custom SSH port)

#### Automatic Deployment

Push to trigger automatic deployment:

```bash
# Deploy to production
git push origin main

# Deploy to development
git push origin dev
```

The GitHub Action will:
1. Build the application
2. Connect to your server via SSH
3. Pull latest code
4. Install dependencies
5. Build the application
6. Run database migrations
7. Restart PM2 processes

### Option B: Manual Deployment

If GitHub Actions aren't available, deploy manually:

#### Production Deployment

```bash
cd /var/www/dtvisuals/app

# Pull latest code
sudo -u dtvisuals git pull origin main

# Install dependencies
sudo -u dtvisuals npm ci --production

# Build application
sudo -u dtvisuals npm run build

# Run database migrations
sudo -u dtvisuals npm run db:push

# Restart PM2
sudo -u dtvisuals pm2 restart dtvisuals-prod
```

#### Development Deployment

```bash
cd /var/www/dtvisuals/app

# Pull latest code  
sudo -u dtvisuals git pull origin dev

# Install dependencies
sudo -u dtvisuals npm ci

# Build application
sudo -u dtvisuals npm run build

# Run database migrations
sudo -u dtvisuals NODE_ENV=development npm run db:push

# Restart PM2
sudo -u dtvisuals pm2 restart dtvisuals-dev
```

## Database Initialization

On first deployment, the application will automatically:

### Production Environment
- Create essential database schema
- Create admin user: `admin@dtvisuals.com` / `admin123`
- Set up roles and permissions

### Development Environment
- Create all production data PLUS:
- Create staff user: `staff@dtvisuals.com` / `admin123`
- Create test clients and client users
- Add sample data for testing

## Application Management

### PM2 Commands

```bash
# View application status
sudo -u dtvisuals pm2 list

# View logs
sudo -u dtvisuals pm2 logs dtvisuals-prod
sudo -u dtvisuals pm2 logs dtvisuals-dev

# Monitor performance
sudo -u dtvisuals pm2 monit

# Restart applications
sudo -u dtvisuals pm2 restart dtvisuals-prod
sudo -u dtvisuals pm2 restart dtvisuals-dev
```

### Health Checks

```bash
# Check production health
curl http://localhost:5001/api/health

# Check development health
curl http://localhost:5002/api/health

# Check web access
curl -I https://yourdomain.com
curl -I https://dev.yourdomain.com
```

## Troubleshooting

### Upload Directory Issues

If uploads are not working or files disappear after deployment:

```bash
# Check if upload directories exist
ls -la /var/www/dtvisuals/uploads/
ls -la /var/www/dtvisuals/uploads/prod/
ls -la /var/www/dtvisuals/uploads/dev/

# Check permissions
ls -ld /var/www/dtvisuals/uploads/*
# Should show: drwxr-xr-x dtvisuals www-data

# Check environment variables in your .env files
grep UPLOADS_DIR /var/www/dtvisuals/app/.env.prod
grep UPLOADS_DIR /var/www/dtvisuals/app/.env.dev
# Should show: UPLOADS_DIR=/var/www/dtvisuals/uploads/prod (or dev)

# Test upload directory access
sudo -u dtvisuals touch /var/www/dtvisuals/uploads/prod/test.txt
sudo -u dtvisuals ls -la /var/www/dtvisuals/uploads/prod/test.txt
sudo -u dtvisuals rm /var/www/dtvisuals/uploads/prod/test.txt

# Fix permissions if needed
sudo chown -R dtvisuals:www-data /var/www/dtvisuals/uploads/
sudo chmod -R 755 /var/www/dtvisuals/uploads/

# Recreate directories if missing
sudo mkdir -p /var/www/dtvisuals/uploads/{prod,dev}
sudo chown -R dtvisuals:www-data /var/www/dtvisuals/uploads/
sudo chmod -R 755 /var/www/dtvisuals/uploads/
```

**Common Upload Issues:**
- Files disappear after deployment → Check UPLOADS_DIR in .env files points to persistent directory
- Permission denied errors → Run the permission fix commands above  
- 404 errors for uploaded files → Verify Nginx serves `/uploads` path correctly
- Large file uploads fail → Check `MAX_FILE_SIZE` in .env and Nginx client_max_body_size

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Verify database exists
   sudo -u postgres psql -l | grep dtvisuals
   ```

2. **Application Won't Start**
   ```bash
   # Check PM2 logs
   sudo -u dtvisuals pm2 logs --err
   
   # Verify environment files
   ls -la /var/www/dtvisuals/app/.env.*
   ```

3. **SSL Certificate Issues**
   ```bash
   # Renew certificates
   sudo certbot renew --nginx
   
   # Check certificate status
   sudo certbot certificates
   ```

### Recovery

If deployment fails:

```bash
# Check recent backups
ls -la /var/www/dtvisuals/app.backup.*

# Restore from backup
sudo mv /var/www/dtvisuals/app.backup.YYYYMMDD-HHMMSS /var/www/dtvisuals/app

# Restart services
sudo -u dtvisuals pm2 restart all
```

## URLs

After successful deployment:

- **Production**: https://yourdomain.com
- **Development**: https://dev.yourdomain.com

## Support

For issues with this deployment guide:
- Check PM2 logs: `sudo -u dtvisuals pm2 logs`
- Review Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Database logs: `sudo tail -f /var/log/postgresql/postgresql-*.log`