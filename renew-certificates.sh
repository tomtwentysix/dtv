#!/bin/bash

echo "=== Let's Encrypt Certificate Renewal ==="

# Check certificate status
echo "📋 Current certificate status:"
docker run --rm \
    -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
    certbot/certbot:latest \
    certificates

echo ""
echo "🔄 Attempting certificate renewal..."

# Perform renewal
docker run --rm \
    --name dt-visuals-certbot-renew \
    -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
    -v "$(pwd)/certbot/www:/var/www/certbot" \
    -v "$(pwd)/certbot/logs:/var/log/letsencrypt" \
    certbot/certbot:latest \
    renew \
    --webroot \
    --webroot-path=/var/www/certbot

if [ $? -eq 0 ]; then
    echo "✅ Certificate renewal completed successfully!"
    
    # Reload nginx to use new certificates
    echo "🔄 Reloading nginx with new certificates..."
    docker exec dt-visuals-nginx nginx -s reload
    
    if [ $? -eq 0 ]; then
        echo "✅ Nginx reloaded successfully!"
    else
        echo "⚠️  Nginx reload failed, restarting container..."
        docker restart dt-visuals-nginx
    fi
    
    echo ""
    echo "📋 Updated certificate status:"
    docker run --rm \
        -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
        certbot/certbot:latest \
        certificates
        
else
    echo "❌ Certificate renewal failed!"
    echo "📋 Check logs:"
    echo "  docker logs dt-visuals-certbot-renew"
    echo "  cat ./certbot/logs/letsencrypt.log"
    exit 1
fi

echo ""
echo "🎉 Certificate renewal process completed!"
echo "💡 Certificates are automatically renewed every 12 hours by the certbot container"