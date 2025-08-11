#!/bin/sh

echo "=== DT Visuals Nginx + Let's Encrypt Startup Script ==="
echo "Installing dependencies and waiting for app containers..."

# Install required packages including certbot dependencies
apk add --no-cache wget curl netcat-openbsd openssl

# Function to check if a service is responding
check_service() {
    local host=$1
    local port=$2
    local max_attempts=60
    local attempt=1
    
    echo "🔍 Checking $host:$port service..."
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z "$host" "$port" 2>/dev/null; then
            if wget -q --spider --timeout=3 "http://$host:$port/api/health" 2>/dev/null; then
                echo "✅ $host:$port is ready and healthy"
                return 0
            else
                echo "⏳ $host:$port port open but health check failed (attempt $attempt/$max_attempts)"
            fi
        else
            echo "⏳ $host:$port port not yet available (attempt $attempt/$max_attempts)"
        fi
        
        sleep 3
        attempt=$((attempt + 1))
    done
    
    echo "⚠️  $host:$port failed to become ready after $max_attempts attempts"
    echo "🚀 Starting nginx anyway (services may still be initializing)..."
    return 1
}

# Wait for both app services
echo "📋 Waiting for application services to be ready..."
check_service "app-prod" "5000"
check_service "app-dev" "5000"

# Create directories for Let's Encrypt
echo "🔧 Setting up Let's Encrypt directories..."
mkdir -p /etc/letsencrypt/live/dtvisuals.com/
mkdir -p /var/www/certbot
mkdir -p /var/log/letsencrypt

# Check for existing Let's Encrypt certificates
echo "🔧 Checking SSL certificates..."
if [ -f "/etc/letsencrypt/live/dtvisuals.com/fullchain.pem" ] && [ -f "/etc/letsencrypt/live/dtvisuals.com/privkey.pem" ]; then
    echo "✅ Let's Encrypt certificates found"
    
    # Verify certificates are valid
    if openssl x509 -checkend 604800 -noout -in /etc/letsencrypt/live/dtvisuals.com/fullchain.pem; then
        echo "✅ Certificates are valid for at least 7 days"
    else
        echo "⚠️  Certificates expire within 7 days - renewal needed"
    fi
else
    echo "⚠️  Let's Encrypt certificates not found, creating temporary self-signed certificates..."
    
    # Create temporary self-signed certificates for initial startup
    openssl req -x509 -nodes -days 30 -newkey rsa:2048 \
        -keyout /etc/letsencrypt/live/dtvisuals.com/privkey.pem \
        -out /etc/letsencrypt/live/dtvisuals.com/fullchain.pem \
        -subj "/C=US/ST=State/L=City/O=DT-Visuals/OU=Media/CN=dtvisuals.com/emailAddress=admin@dtvisuals.com"
    
    echo "✅ Temporary self-signed certificates created (30 days)"
    echo "💡 Let's Encrypt will replace these with trusted certificates after startup"
fi

# Set proper permissions
chmod 600 /etc/letsencrypt/live/dtvisuals.com/privkey.pem
chmod 644 /etc/letsencrypt/live/dtvisuals.com/fullchain.pem

echo "🔧 Validating nginx configuration..."
nginx -t || {
    echo "❌ Nginx configuration test failed!"
    exit 1
}

echo "✅ Nginx configuration is valid!"

# Start nginx in background for Let's Encrypt verification
echo "🚀 Starting nginx for Let's Encrypt integration..."

# Start nginx in daemon mode initially
nginx

# Wait a moment for nginx to start
sleep 5

echo "🔒 Let's Encrypt certificate setup completed"
echo "📋 Certificate status:"
echo "  - Temporary: Created for immediate HTTPS functionality"
echo "  - Automatic: Certbot will obtain trusted certificates"
echo "  - Renewal: Automatic every 12 hours"

# Keep the container running and monitor nginx
echo "🔄 Monitoring nginx process..."
while sleep 60; do
    if ! pgrep nginx > /dev/null; then
        echo "⚠️  Nginx stopped, restarting..."
        nginx
    fi
done