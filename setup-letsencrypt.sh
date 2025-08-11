#!/bin/bash

echo "=== Let's Encrypt Setup for DT Visuals ==="

# Configuration
DOMAIN="dtvisuals.com"
EMAIL="admin@dtvisuals.com"
STAGING=${1:-false}

if [ "$STAGING" = "true" ]; then
    echo "🧪 Using Let's Encrypt staging environment"
    STAGING_FLAG="--staging"
else
    echo "🔒 Using Let's Encrypt production environment"
    STAGING_FLAG=""
fi

# Create necessary directories
echo "📁 Creating certificate directories..."
mkdir -p ./certbot/conf
mkdir -p ./certbot/www
mkdir -p ./certbot/logs

# Check if domain is accessible
echo "🌐 Checking domain accessibility..."
if ! curl -s --connect-timeout 10 "http://$DOMAIN" > /dev/null; then
    echo "⚠️  Warning: $DOMAIN may not be accessible from the internet"
    echo "   Make sure your domain points to this server's IP address"
    echo "   You can still continue for local testing"
fi

# Start the services needed for certificate generation
echo "🚀 Starting services for certificate generation..."
docker-compose -f docker-compose.dual.yml up -d app-prod app-dev db-prod db-dev

# Wait for applications to be ready
echo "⏳ Waiting for applications to start..."
sleep 30

# Start nginx with Let's Encrypt configuration
echo "🔧 Starting nginx with Let's Encrypt configuration..."
docker run --rm -d \
    --name dt-visuals-nginx-temp \
    --network dtvisuals-network \
    -p 80:80 \
    -p 443:443 \
    -v "$(pwd)/nginx.conf:/etc/nginx/nginx.conf:ro" \
    -v "$(pwd)/nginx-letsencrypt-startup.sh:/docker-entrypoint.sh:ro" \
    -v "$(pwd)/certbot/conf:/etc/letsencrypt:ro" \
    -v "$(pwd)/certbot/www:/var/www/certbot:ro" \
    nginx:alpine /docker-entrypoint.sh

# Wait for nginx to start
sleep 10

# Initial certificate generation
echo "🔒 Generating initial Let's Encrypt certificates..."
docker run --rm \
    --name dt-visuals-certbot-init \
    --network dtvisuals-network \
    -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
    -v "$(pwd)/certbot/www:/var/www/certbot" \
    -v "$(pwd)/certbot/logs:/var/log/letsencrypt" \
    certbot/certbot:latest \
    certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    $STAGING_FLAG \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" \
    -d "dev.$DOMAIN"

if [ $? -eq 0 ]; then
    echo "✅ Certificates generated successfully!"
    
    # Stop temporary nginx
    docker stop dt-visuals-nginx-temp 2>/dev/null || true
    
    # Start the full deployment with Let's Encrypt
    echo "🚀 Starting full deployment with Let's Encrypt..."
    docker-compose -f docker-compose.letsencrypt.yml up -d
    
    echo ""
    echo "🎉 Let's Encrypt setup completed successfully!"
    echo ""
    echo "📋 Certificate Details:"
    docker run --rm \
        -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
        certbot/certbot:latest \
        certificates
    
    echo ""
    echo "🌐 Your sites are now available at:"
    echo "  • https://dtvisuals.com (Production)"
    echo "  • https://dev.dtvisuals.com (Development)"
    echo "  • Automatic certificate renewal every 12 hours"
    
else
    echo "❌ Certificate generation failed!"
    echo "💡 Common solutions:"
    echo "  1. Check domain DNS points to this server"
    echo "  2. Ensure ports 80/443 are accessible from internet"
    echo "  3. Try staging environment first: ./setup-letsencrypt.sh true"
    echo "  4. Check logs: docker logs dt-visuals-certbot-init"
    
    # Cleanup on failure
    docker stop dt-visuals-nginx-temp 2>/dev/null || true
    exit 1
fi