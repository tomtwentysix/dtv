# DT Visuals - Traefik Deployment Guide

This guide explains how to deploy DT Visuals with Traefik reverse proxy and automatic Let's Encrypt SSL certificates for both production (`dtvisuals.com`) and development (`dev.dtvisuals.com`) environments.

## Features

- ✅ Automatic HTTPS with Let's Encrypt certificates
- ✅ SNI support for multiple domains on the same IP
- ✅ Production and development environments
- ✅ Automatic HTTP to HTTPS redirect
- ✅ WWW to non-WWW redirect for production
- ✅ Traefik dashboard for monitoring
- ✅ Health checks for all services
- ✅ Separate databases for prod and dev

## Prerequisites

1. **Server Requirements**:
   - Ubuntu 20.04+ or CentOS 8+ (recommended)
   - Docker and Docker Compose installed
   - At least 2GB RAM, 20GB disk space
   - Ports 80 and 443 accessible from the internet

2. **DNS Requirements**:
   - `dtvisuals.com` A record pointing to your server IP
   - `www.dtvisuals.com` A record pointing to your server IP  
   - `dev.dtvisuals.com` A record pointing to your server IP
   - `traefik.dtvisuals.com` A record pointing to your server IP (optional, for dashboard)

3. **Domain Verification**:
   ```bash
   # Verify DNS is properly configured
   nslookup dtvisuals.com
   nslookup dev.dtvisuals.com
   ```

## Quick Start

### 1. Clone and Configure

```bash
# Clone your repository
git clone <your-repo-url>
cd dt-visuals

# Copy environment template
cp .env.traefik .env
```

### 2. Configure Environment Variables

Edit the `.env` file with your settings:

```env
# REQUIRED: Your email for Let's Encrypt notifications
ACME_EMAIL=your-email@example.com

# REQUIRED: Secure database passwords
PROD_POSTGRES_PASSWORD=your-very-secure-production-password
DEV_POSTGRES_PASSWORD=your-secure-development-password

# REQUIRED: Session secrets (generate with: openssl rand -base64 32)
PROD_SESSION_SECRET=your-very-secure-production-session-secret
DEV_SESSION_SECRET=your-secure-development-session-secret

# Optional: Traefik dashboard credentials
TRAEFIK_DOMAIN=dtvisuals.com
TRAEFIK_USERS=admin:$$2y$$10$$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
```

### 3. Deploy

```bash
# Run the deployment script
./deploy-traefik.sh
```

## Manual Deployment Steps

If you prefer manual deployment:

### 1. Create External Network

```bash
docker network create traefik
```

### 2. Create Required Directories

```bash
mkdir -p traefik-data
chmod 600 traefik-data
```

### 3. Update Traefik Configuration

Edit `traefik.yml` and update the email address:

```yaml
certificatesResolvers:
  letsencrypt:
    acme:
      email: your-email@example.com  # Update this
```

### 4. Start Services

```bash
# Start all services
docker-compose -f docker-compose.traefik.yml up -d

# Check status
docker-compose -f docker-compose.traefik.yml ps

# View logs
docker-compose -f docker-compose.traefik.yml logs traefik
```

## Service Endpoints

After deployment, your services will be available at:

- **Production**: https://dtvisuals.com
- **Development**: https://dev.dtvisuals.com  
- **Traefik Dashboard**: https://traefik.dtvisuals.com (optional)

## SSL Certificate Management

### Certificate Status

Check certificate status:

```bash
# View Traefik logs for certificate generation
docker-compose -f docker-compose.traefik.yml logs traefik | grep -i acme

# List certificates
docker exec traefik cat /data/acme.json | jq '.letsencrypt.Certificates[].domain'
```

### Certificate Renewal

Let's Encrypt certificates are automatically renewed by Traefik. No manual intervention required.

### Staging Certificates (Testing)

For testing, uncomment the staging server line in `traefik.yml`:

```yaml
certificatesResolvers:
  letsencrypt:
    acme:
      # Uncomment for testing
      caServer: https://acme-staging-v02.api.letsencrypt.org/directory
```

## Environment Management

### Production Only

To run only production:

```bash
docker-compose -f docker-compose.traefik.yml up -d traefik app-prod postgres-prod
```

### Development Only

To run only development:

```bash
docker-compose -f docker-compose.traefik.yml up -d traefik app-dev postgres-dev
```

### Both Environments

To run both (default):

```bash
docker-compose -f docker-compose.traefik.yml up -d
```

## Database Access

### Production Database

```bash
# Access production database
docker exec -it dt-visuals-postgres-prod psql -U postgres -d dt_visuals_prod
```

### Development Database

```bash
# Access development database
docker exec -it dt-visuals-postgres-dev psql -U postgres -d dt_visuals_dev
```

## Monitoring and Maintenance

### View Service Status

```bash
docker-compose -f docker-compose.traefik.yml ps
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.traefik.yml logs

# Specific service
docker-compose -f docker-compose.traefik.yml logs traefik
docker-compose -f docker-compose.traefik.yml logs app-prod
docker-compose -f docker-compose.traefik.yml logs app-dev
```

### Health Checks

All services include health checks. View health status:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Backup Databases

```bash
# Backup production
docker exec dt-visuals-postgres-prod pg_dump -U postgres dt_visuals_prod > backup-prod-$(date +%Y%m%d).sql

# Backup development
docker exec dt-visuals-postgres-dev pg_dump -U postgres dt_visuals_dev > backup-dev-$(date +%Y%m%d).sql
```

## Troubleshooting

### Common Issues

1. **Certificate Generation Failed**:
   ```bash
   # Check Traefik logs
   docker-compose -f docker-compose.traefik.yml logs traefik | grep -i error
   
   # Verify DNS is pointing to your server
   nslookup dtvisuals.com
   ```

2. **Service Not Starting**:
   ```bash
   # Check service health
   docker-compose -f docker-compose.traefik.yml ps
   
   # View service logs
   docker-compose -f docker-compose.traefik.yml logs app-prod
   ```

3. **Database Connection Issues**:
   ```bash
   # Test database connectivity
   docker exec dt-visuals-postgres-prod pg_isready -U postgres
   ```

### Port Conflicts

If ports 80/443 are already in use:

```bash
# Find what's using the ports
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# Stop conflicting services (example: Apache)
sudo systemctl stop apache2
sudo systemctl disable apache2
```

### Reset Everything

To completely reset the deployment:

```bash
# Stop and remove all containers
docker-compose -f docker-compose.traefik.yml down -v

# Remove all images
docker-compose -f docker-compose.traefik.yml down --rmi all

# Remove external network
docker network rm traefik

# Remove volumes (WARNING: This deletes all data)
docker volume rm $(docker volume ls -q | grep dt-visuals)

# Remove certificate data
sudo rm -rf traefik-data
```

## Security Considerations

1. **Firewall**: Only expose ports 80 and 443 to the internet
2. **Database**: Databases are not exposed to the internet by default
3. **Dashboard**: Traefik dashboard is protected with basic auth
4. **SSL**: All traffic is automatically redirected to HTTPS
5. **Headers**: Security headers are applied by default

## Support

For issues specific to the Traefik deployment, check:

1. Service logs: `docker-compose -f docker-compose.traefik.yml logs`
2. Traefik dashboard: https://traefik.dtvisuals.com
3. Certificate status in Traefik logs
4. DNS resolution: `nslookup your-domain.com`

Remember to:
- Keep your `.env` file secure and never commit it to version control
- Regularly backup your databases
- Monitor certificate expiration (though auto-renewal should handle this)
- Update Docker images regularly for security patches