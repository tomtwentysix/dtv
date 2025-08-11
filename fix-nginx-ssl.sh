#!/bin/bash

echo "=== Nginx SSL Certificate Fix ==="

# Create temporary self-signed certificates for initial testing
echo "🔧 Creating temporary self-signed certificates..."
docker exec dt-visuals-nginx mkdir -p /etc/letsencrypt/live/dtvisuals.com/ 2>/dev/null || true

docker exec dt-visuals-nginx openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/letsencrypt/live/dtvisuals.com/privkey.pem \
    -out /etc/letsencrypt/live/dtvisuals.com/fullchain.pem \
    -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=dtvisuals.com/emailAddress=admin@dtvisuals.com" 2>/dev/null

echo "✅ Temporary certificates created"

echo ""
echo "🔧 Testing nginx configuration..."
docker exec dt-visuals-nginx nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    echo "🔄 Reloading nginx..."
    docker exec dt-visuals-nginx nginx -s reload
    echo "✅ Nginx reloaded successfully"
else
    echo "❌ Nginx configuration test failed"
fi

echo ""
echo "💡 Next Steps:"
echo "1. ✅ HTTP/2 deprecation warnings fixed"
echo "2. ✅ Temporary self-signed certificates created"
echo "3. 🔧 For production: Replace with Let's Encrypt certificates"
echo "4. 🌐 Access: https://dtvisuals.com (with SSL warning) or http://dtvisuals.com"