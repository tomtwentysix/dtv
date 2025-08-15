#!/bin/bash

# SSL Certificate Setup with Let's Encrypt
# Run this after server setup and DNS configuration

set -e

echo "=== DT Visuals SSL Certificate Setup ==="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root (use sudo)"
   exit 1
fi

# Check if domains are provided
DOMAINS=${1:-"dtvisuals.com,www.dtvisuals.com,dev.dtvisuals.com"}
EMAIL=${2:-"admin@dtvisuals.com"}

echo "📋 Configuration:"
echo "   Domains: $DOMAINS"
echo "   Email: $EMAIL"
echo ""

# Verify DNS configuration
echo "🔍 Checking DNS configuration..."
for domain in $(echo $DOMAINS | tr ',' ' '); do
    echo "   Checking $domain..."
    if nslookup $domain > /dev/null 2>&1; then
        echo "   ✅ $domain DNS resolved"
    else
        echo "   ⚠️  $domain DNS not resolved - continuing anyway"
    fi
done

# Create webroot directory for certbot challenge
echo "🔧 Preparing webroot for certbot..."
mkdir -p /var/www/certbot
chmod -R 755 /var/www/certbot

# Create nginx config to handle certbot challenges without stopping the app
echo "⚙️ Creating temporary nginx config for certbot..."
cat > /etc/nginx/conf.d/certbot-acme.conf << 'EOF'
server {
    listen 80;
    server_name dtvisuals.com www.dtvisuals.com dev.dtvisuals.com;
    
    # Only handle Let's Encrypt challenges
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files $uri =404;
    }
    
    # Preserve existing traffic
    location / {
        return 404;
    }
}
EOF

# Reload nginx to apply the temporary config
echo "🔄 Reloading nginx to handle certbot challenges..."
nginx -t && systemctl reload nginx

# Get certificates using webroot mode
echo "🔐 Obtaining SSL certificates..."
# Create domain arguments correctly
DOMAIN_ARGS=""
for domain in $(echo $DOMAINS | tr ',' ' '); do
    DOMAIN_ARGS="$DOMAIN_ARGS -d $domain"
done

certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --agree-tos \
    --no-eff-email \
    --email $EMAIL \
    $DOMAIN_ARGS

# Remove temporary nginx config
echo "🧹 Cleaning up temporary nginx config..."
rm -f /etc/nginx/conf.d/certbot-acme.conf

# Create Diffie-Hellman parameters for better security
echo "🔑 Generating Diffie-Hellman parameters..."
if [[ ! -f /etc/ssl/certs/dhparam.pem ]]; then
    openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048
fi

# Setup nginx configuration
echo "⚙️  Configuring nginx..."

# Create nginx site configuration
cat > /etc/nginx/sites-available/dtvisuals << 'EOF'
# DT Visuals Nginx Configuration
# Handles both production and development environments

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=upload:10m rate=2r/s;

# Upstream servers
upstream prod_app {
    server 127.0.0.1:5001;
    keepalive 32;
}

upstream dev_app {
    server 127.0.0.1:5002;
    keepalive 32;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name dtvisuals.com www.dtvisuals.com dev.dtvisuals.com;
    
    # Let's Encrypt challenges
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files $uri =404;
    }
    
    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# Production HTTPS Server
server {
    listen 443 ssl http2;
    server_name dtvisuals.com www.dtvisuals.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/dtvisuals.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dtvisuals.com/privkey.pem;
    ssl_dhparam /etc/ssl/certs/dhparam.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 5m;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # File upload size
    client_max_body_size 2500M;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # Static files and uploads
    location /uploads/ {
        alias /var/www/dtvisuals/uploads/prod/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options nosniff;
    }
    
    # API routes with rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://prod_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Upload endpoints with stricter rate limiting
    location ~ ^/api/(media|upload)/ {
        limit_req zone=upload burst=5 nodelay;
        proxy_pass http://prod_app;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 1800s;
        proxy_connect_timeout 75s;
    }
    
    # All other routes to app
    location / {
        proxy_pass http://prod_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}

# Development HTTPS Server
server {
    listen 443 ssl http2;
    server_name dev.dtvisuals.com;
    
    # SSL Configuration (same certificates)
    ssl_certificate /etc/letsencrypt/live/dtvisuals.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dtvisuals.com/privkey.pem;
    ssl_dhparam /etc/ssl/certs/dhparam.pem;
    
    # SSL Security Settings (same as production)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 5m;
    
    # Development-specific headers (less restrictive)
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # File upload size
    client_max_body_size 2500M;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript;
    
    # Static files and uploads
    location /uploads/ {
        alias /var/www/dtvisuals/uploads/dev/;
        expires 1d;
        add_header Cache-Control "public";
    }
    
    # All routes to dev app (no rate limiting for development)
    location / {
        proxy_pass http://dev_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
EOF

# Remove default nginx site and enable our site
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/dtvisuals /etc/nginx/sites-enabled/

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
nginx -t

# Reload nginx to apply the final config
echo "🚀 Reloading nginx with new configuration..."
systemctl reload nginx
systemctl enable nginx

# Setup automatic certificate renewal
echo "🔄 Setting up automatic certificate renewal..."
cat > /etc/cron.d/certbot-renewal << EOF
# Renew Let's Encrypt certificates twice daily
0 */12 * * * root certbot renew --quiet --hook-script "systemctl reload nginx"
EOF

# Test certificate renewal
echo "🧪 Testing certificate renewal..."
certbot renew --dry-run

# Summary
echo ""
echo "=== SSL Setup Complete! ==="
echo ""
echo "✅ SSL certificates obtained for:"
for domain in $(echo $DOMAINS | tr ',' ' '); do
    echo "   - $domain"
done
echo ""
echo "✅ Nginx configured with:"
echo "   - HTTP to HTTPS redirect"
echo "   - Modern SSL/TLS security"
echo "   - Rate limiting"
echo "   - Security headers"
echo "   - Gzip compression"
echo ""
echo "✅ Automatic renewal scheduled"
echo ""
echo "🔗 URLs:"
echo "   Production: https://dtvisuals.com"
echo "   Development: https://dev.dtvisuals.com"
echo ""
echo "📋 Commands:"
echo "   Test SSL: curl -I https://dtvisuals.com"
echo "   Check certificates: certbot certificates"
echo "   Renew certificates: certbot renew"
echo "   Nginx logs: tail -f /var/log/nginx/error.log"
