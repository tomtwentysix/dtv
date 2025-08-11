# Let's Encrypt Integration for DT Visuals

## Overview

Complete Let's Encrypt automation has been added to the DT Visuals deployment system, providing automatic SSL certificate generation, renewal, and management for both production and development environments.

## Features

### ✅ Automatic Certificate Generation
- Initial certificate setup for `dtvisuals.com`, `www.dtvisuals.com`, and `dev.dtvisuals.com`
- Fallback to self-signed certificates if Let's Encrypt fails
- Staging environment support for testing

### ✅ Automatic Renewal
- Certificates automatically renewed every 12 hours
- Smart renewal (only renews if expiring within 30 days)
- Automatic nginx reload after renewal

### ✅ Zero-Downtime Deployment
- Temporary certificates enable immediate HTTPS functionality
- Services start while certificates are being generated
- Graceful fallback mechanisms

## Deployment Methods

### Method 1: Automated Deployment (Recommended)
```bash
# Production deployment with Let's Encrypt
./deploy-with-letsencrypt.sh

# Staging deployment (testing)
./deploy-with-letsencrypt.sh true

# Force certificate renewal
./deploy-with-letsencrypt.sh false true
```

### Method 2: Manual Setup
```bash
# 1. Setup Let's Encrypt certificates
./setup-letsencrypt.sh

# 2. Start full deployment
docker-compose -f docker-compose.letsencrypt.yml up -d
```

### Method 3: GitHub Actions (CI/CD)
The GitHub Actions workflow automatically uses Let's Encrypt for deployments to the production server.

## File Structure

```
├── docker-compose.letsencrypt.yml     # Extended compose with Let's Encrypt
├── setup-letsencrypt.sh               # Initial certificate setup
├── deploy-with-letsencrypt.sh         # Complete deployment script
├── renew-certificates.sh              # Manual renewal script
├── nginx-letsencrypt-startup.sh       # Enhanced nginx startup
└── certbot/                           # Certificate storage
    ├── conf/                          # Let's Encrypt configuration
    ├── www/                           # Webroot for verification
    └── logs/                          # Certificate logs
```

## Configuration

### Domain Configuration
- **Primary**: `dtvisuals.com`
- **WWW**: `www.dtvisuals.com` (redirects to primary)
- **Development**: `dev.dtvisuals.com`

### Email Configuration
- **Admin Email**: `admin@dtvisuals.com` (used for Let's Encrypt notifications)

### Certificate Paths
- **Certificates**: `./certbot/conf/live/dtvisuals.com/`
- **Fullchain**: `fullchain.pem`
- **Private Key**: `privkey.pem`

## Prerequisites

### DNS Configuration
Ensure your domain DNS points to the server:
```bash
# Check DNS resolution
nslookup dtvisuals.com
nslookup dev.dtvisuals.com
```

### Firewall Configuration
Open required ports:
```bash
# HTTP (for Let's Encrypt verification)
sudo ufw allow 80/tcp

# HTTPS (for secure connections)  
sudo ufw allow 443/tcp
```

### Domain Accessibility
Verify domains are accessible from the internet:
```bash
curl -I http://dtvisuals.com
curl -I http://dev.dtvisuals.com
```

## Usage Examples

### Initial Deployment
```bash
# Clone repository
git clone https://github.com/tomtwentysix/dtv.git
cd dtv

# Deploy with Let's Encrypt
./deploy-with-letsencrypt.sh
```

### Testing with Staging
```bash
# Use Let's Encrypt staging (higher rate limits)
./deploy-with-letsencrypt.sh true
```

### Manual Certificate Renewal
```bash
# Check and renew certificates
./renew-certificates.sh
```

### Monitoring Certificates
```bash
# View certificate status
docker run --rm -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
  certbot/certbot:latest certificates

# Check certificate expiration
openssl x509 -enddate -noout -in ./certbot/conf/live/dtvisuals.com/fullchain.pem
```

## Troubleshooting

### Common Issues

**Certificate Generation Fails**
```bash
# Check domain accessibility
curl -I http://dtvisuals.com/.well-known/acme-challenge/test

# Check logs
docker logs dt-visuals-certbot
cat ./certbot/logs/letsencrypt.log
```

**Nginx Won't Start**
```bash
# Test nginx configuration
docker exec dt-visuals-nginx nginx -t

# Check certificate permissions
ls -la ./certbot/conf/live/dtvisuals.com/
```

**Rate Limit Exceeded**
```bash
# Use staging environment
./deploy-with-letsencrypt.sh true

# Wait for rate limit reset (usually 1 hour)
```

### Recovery Commands

**Reset Certificates**
```bash
# Remove existing certificates
sudo rm -rf ./certbot/conf/live/dtvisuals.com/

# Regenerate
./setup-letsencrypt.sh
```

**Fallback to Self-Signed**
```bash
# Deploy without Let's Encrypt
docker-compose -f docker-compose.dual.yml up -d
```

**Force Certificate Renewal**
```bash
# Force renewal regardless of expiration
./deploy-with-letsencrypt.sh false true
```

## Automation Details

### Renewal Schedule
- **Frequency**: Every 12 hours (configurable in docker-compose.letsencrypt.yml)
- **Grace Period**: Certificates renewed if expiring within 30 days
- **Failure Handling**: Logs errors, maintains existing certificates

### Health Monitoring
- **Certificate Validation**: Automatic expiration checking
- **Service Health**: Regular health endpoint monitoring
- **Log Rotation**: Automatic log management

### Security Features
- **HTTPS Enforcement**: Automatic HTTP to HTTPS redirects
- **HSTS Headers**: Strict Transport Security enabled
- **Secure Ciphers**: Modern TLS 1.2/1.3 configuration
- **Rate Limiting**: API endpoint protection

## Integration with Existing Deployment

The Let's Encrypt integration extends the existing dual-environment deployment:

1. **Preserves all existing functionality**
2. **Adds SSL automation on top**
3. **Maintains backward compatibility**
4. **Uses same database and application configuration**

## Production Checklist

Before deploying to production:

- [ ] Domain DNS points to server IP
- [ ] Ports 80 and 443 are accessible from internet
- [ ] Email address is configured correctly
- [ ] Firewall allows HTTP/HTTPS traffic
- [ ] Server has sufficient disk space for certificates
- [ ] Backup strategy includes certificate directory

## Support and Maintenance

### Regular Maintenance
- Monitor certificate expiration dates
- Check renewal logs monthly
- Update Let's Encrypt client annually
- Review security headers quarterly

### Monitoring Commands
```bash
# View service status
docker-compose -f docker-compose.letsencrypt.yml ps

# Check certificate health
./renew-certificates.sh

# View all logs
docker-compose -f docker-compose.letsencrypt.yml logs -f
```

This Let's Encrypt integration provides enterprise-grade SSL automation while maintaining the simplicity and reliability of the existing deployment system.