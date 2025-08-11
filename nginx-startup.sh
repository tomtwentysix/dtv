#!/bin/sh

echo "=== DT Visuals Nginx Startup Script ==="
echo "Installing dependencies and waiting for app containers..."

# Install required packages including openssl for certificate generation
apk add --no-cache wget curl netcat-openbsd openssl

# Function to check if a service is responding
check_service() {
    local host=$1
    local port=$2
    local max_attempts=60
    local attempt=1
    
    echo "🔍 Checking $host:$port service..."
    
    while [ $attempt -le $max_attempts ]; do
        # First check if the port is open
        if nc -z "$host" "$port" 2>/dev/null; then
            # Then check if the health endpoint responds
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

# Wait for both app services with extended timeouts
echo "📋 Waiting for application services to be ready..."
check_service "app-prod" "5000"
check_service "app-dev" "5000"

echo "🔧 Checking SSL certificates..."
if [ ! -f "/etc/letsencrypt/live/dtvisuals.com/fullchain.pem" ]; then
    echo "⚠️  SSL certificates not found, creating temporary self-signed certificates..."
    
    # Create certificates in /tmp first (writable), then move via volume mount
    TMP_CERT_DIR="/tmp/ssl-certs"
    mkdir -p "$TMP_CERT_DIR"
    
    # Generate self-signed certificate in writable directory
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$TMP_CERT_DIR/privkey.pem" \
        -out "$TMP_CERT_DIR/fullchain.pem" \
        -subj "/C=US/ST=State/L=City/O=DT-Visuals/OU=Media/CN=dtvisuals.com/emailAddress=admin@dtvisuals.com" 2>/dev/null
    
    # Try to move certificates to expected location if volume is mounted writable
    if mkdir -p /etc/letsencrypt/live/dtvisuals.com/ 2>/dev/null; then
        cp "$TMP_CERT_DIR/privkey.pem" /etc/letsencrypt/live/dtvisuals.com/privkey.pem 2>/dev/null || true
        cp "$TMP_CERT_DIR/fullchain.pem" /etc/letsencrypt/live/dtvisuals.com/fullchain.pem 2>/dev/null || true
    fi
    
    # If still no certificates in expected location, create a simplified nginx config without SSL
    if [ ! -f "/etc/letsencrypt/live/dtvisuals.com/fullchain.pem" ]; then
        echo "⚠️  Cannot create certificates in read-only filesystem, switching to HTTP-only mode"
        
        # Create a temporary nginx config without SSL
        cat > /tmp/nginx-http-only.conf << 'EOF'
events {
    worker_connections 1024;
}
http {
    upstream app-prod {
        server app-prod:5000;
    }
    upstream app-dev {
        server app-dev:5000;
    }
    server {
        listen 80;
        server_name dtvisuals.com www.dtvisuals.com;
        location / {
            proxy_pass http://app-prod;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    server {
        listen 80;
        server_name dev.dtvisuals.com;
        location / {
            proxy_pass http://app-dev;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF
        
        echo "📝 Created HTTP-only nginx configuration"
        cp /tmp/nginx-http-only.conf /etc/nginx/nginx.conf
    else
        echo "✅ Temporary self-signed certificates created"
    fi
else
    echo "✅ SSL certificates found"
fi

echo "🔧 Validating nginx configuration..."
nginx -t || {
    echo "❌ Nginx configuration test failed!"
    exit 1
}

echo "✅ Nginx configuration is valid!"
echo "🚀 Starting nginx reverse proxy..."
exec nginx -g "daemon off;"