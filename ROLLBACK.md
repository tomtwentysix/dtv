# DT Visuals Rollback Instructions

## Emergency Rollback Procedures

### Quick Rollback (using backup)

If the current deployment is broken, restore from the latest automatic backup:

```bash
# 1. Stop current application
sudo -u dtvisuals pm2 stop dtvisuals-prod
sudo -u dtvisuals pm2 stop dtvisuals-dev

# 2. Find latest backup
ls -la /var/www/dtvisuals/app.backup.*

# 3. Restore backup (replace TIMESTAMP with actual backup timestamp)
sudo -u dtvisuals rm -rf /var/www/dtvisuals/app
sudo -u dtvisuals mv /var/www/dtvisuals/app.backup.TIMESTAMP /var/www/dtvisuals/app

# 4. Restart applications
sudo -u dtvisuals pm2 start ecosystem.config.js
```

### Git-based Rollback

If you know the commit hash to rollback to:

```bash
# 1. Navigate to app directory
cd /var/www/dtvisuals/app

# 2. Check current status
git log --oneline -5

# 3. Rollback to specific commit
sudo -u dtvisuals git reset --hard COMMIT_HASH

# 4. Reinstall dependencies (in case package.json changed)
sudo -u dtvisuals npm ci --production

# 5. Rebuild application
sudo -u dtvisuals npm run build

# 6. Restart applications
sudo -u dtvisuals pm2 restart all
```

### Database Rollback

If database migrations need to be rolled back:

```bash
# 1. Check migration status
cd /var/www/dtvisuals/app
npm run db:status

# 2. Rollback specific migration (if supported by Drizzle)
# Note: Drizzle doesn't have built-in rollback, manual intervention required

# 3. Restore database from backup (if available)
# Production database
sudo -u postgres pg_restore -d dtvisuals_prod /path/to/backup.dump

# Development database  
sudo -u postgres pg_restore -d dtvisuals_dev /path/to/backup.dump
```

## Rollback Strategies by Issue Type

### 1. Application Won't Start

**Symptoms:**
- PM2 shows app as "errored" or "stopped"
- Health check fails
- 502/503 errors from nginx

**Solution:**
```bash
# Check PM2 logs
sudo -u dtvisuals pm2 logs dtvisuals-prod --lines 50

# Common fixes:
sudo -u dtvisuals pm2 restart dtvisuals-prod
sudo -u dtvisuals pm2 delete dtvisuals-prod && pm2 start ecosystem.config.js --only dtvisuals-prod

# If still failing, restore from backup (see Quick Rollback above)
```

### 2. Database Migration Errors

**Symptoms:**
- Migration fails during deployment
- Database schema errors
- Data corruption

**Solution:**
```bash
# 1. Stop application to prevent further damage
sudo -u dtvisuals pm2 stop all

# 2. Restore database from backup
sudo -u postgres createdb dtvisuals_prod_backup
sudo -u postgres pg_dump dtvisuals_prod | sudo -u postgres psql dtvisuals_prod_backup

# 3. Drop and recreate database (DESTRUCTIVE - only if you have backups)
sudo -u postgres dropdb dtvisuals_prod
sudo -u postgres createdb dtvisuals_prod -O dtvisuals

# 4. Restore from known good backup or re-run migrations from clean state
```

### 3. SSL Certificate Issues

**Symptoms:**
- HTTPS not working
- Browser security warnings
- Nginx fails to start

**Solution:**
```bash
# 1. Check certificate status
sudo certbot certificates

# 2. If expired, renew immediately
sudo certbot renew --force-renewal

# 3. If corrupted, re-obtain certificates
sudo certbot delete --cert-name dtvisuals.com
sudo ./ssl-setup.sh

# 4. Restart nginx
sudo systemctl restart nginx
```

### 4. Nginx Configuration Issues

**Symptoms:**
- 502 Bad Gateway
- Nginx fails to start
- Configuration test fails

**Solution:**
```bash
# 1. Test current configuration
sudo nginx -t

# 2. If failed, restore backup nginx config
sudo cp /etc/nginx/sites-available/dtvisuals.backup /etc/nginx/sites-available/dtvisuals

# 3. Or restore from git
cd /var/www/dtvisuals/app
sudo cp nginx.conf /etc/nginx/sites-available/dtvisuals

# 4. Test and reload
sudo nginx -t && sudo systemctl reload nginx
```

## Complete System Rollback

If everything is broken, restore the entire system to a known good state:

```bash
# 1. Stop all services
sudo -u dtvisuals pm2 stop all
sudo systemctl stop nginx

# 2. Restore application from backup
sudo -u dtvisuals rm -rf /var/www/dtvisuals/app
sudo -u dtvisuals mv /var/www/dtvisuals/app.backup.LATEST /var/www/dtvisuals/app

# 3. Restore database
sudo -u postgres dropdb dtvisuals_prod && sudo -u postgres createdb dtvisuals_prod -O dtvisuals
sudo -u postgres psql dtvisuals_prod < /path/to/prod_backup.sql

sudo -u postgres dropdb dtvisuals_dev && sudo -u postgres createdb dtvisuals_dev -O dtvisuals  
sudo -u postgres psql dtvisuals_dev < /path/to/dev_backup.sql

# 4. Restore nginx configuration
sudo cp /etc/nginx/sites-available/dtvisuals.backup /etc/nginx/sites-available/dtvisuals

# 5. Start services
sudo systemctl start nginx
cd /var/www/dtvisuals/app
sudo -u dtvisuals pm2 start ecosystem.config.js

# 6. Verify health
curl -f http://localhost:5001/api/health
curl -f http://localhost:5002/api/health
```

## Prevention (Regular Backups)

Set up automatic backups to prevent data loss:

```bash
# Create backup script
sudo tee /usr/local/bin/dtvisuals-backup << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/dtvisuals"
DATE=$(date +%Y%m%d-%H%M%S)

mkdir -p $BACKUP_DIR

# Backup databases
sudo -u postgres pg_dump dtvisuals_prod > $BACKUP_DIR/prod-$DATE.sql
sudo -u postgres pg_dump dtvisuals_dev > $BACKUP_DIR/dev-$DATE.sql

# Backup application files
tar -czf $BACKUP_DIR/app-$DATE.tar.gz -C /var/www/dtvisuals app

# Backup nginx config
cp /etc/nginx/sites-available/dtvisuals $BACKUP_DIR/nginx-$DATE.conf

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

sudo chmod +x /usr/local/bin/dtvisuals-backup

# Schedule daily backups
echo "0 2 * * * root /usr/local/bin/dtvisuals-backup" | sudo tee /etc/cron.d/dtvisuals-backup
```

## Emergency Contacts & Resources

- **GitHub Repository:** `https://github.com/tomtwentysix/dtv`
- **Server Access:** SSH to configured server
- **Database:** PostgreSQL on localhost:5432
- **Logs Location:** 
  - Application: `/var/log/dtvisuals/`
  - PM2: `sudo -u dtvisuals pm2 logs`
  - Nginx: `/var/log/nginx/`
  - PostgreSQL: `/var/log/postgresql/`

## Common Commands Reference

```bash
# Application Management
sudo -u dtvisuals pm2 status
sudo -u dtvisuals pm2 logs dtvisuals-prod
sudo -u dtvisuals pm2 restart dtvisuals-prod
sudo -u dtvisuals pm2 stop dtvisuals-prod
sudo -u dtvisuals pm2 start ecosystem.config.js --only dtvisuals-prod

# Database Management
sudo -u postgres psql dtvisuals_prod
sudo -u postgres pg_dump dtvisuals_prod > backup.sql
sudo -u postgres psql dtvisuals_prod < backup.sql

# Nginx Management
sudo nginx -t
sudo systemctl status nginx
sudo systemctl restart nginx
sudo tail -f /var/log/nginx/error.log

# SSL Management
sudo certbot certificates
sudo certbot renew
sudo certbot renew --dry-run
```