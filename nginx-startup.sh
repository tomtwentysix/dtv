#!/bin/sh

echo "=== DT Visuals Nginx Startup Script ==="
echo "Installing dependencies and waiting for app containers..."

# Install required packages
apk add --no-cache wget curl netcat-openbsd

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

echo "🔧 Validating nginx configuration..."
nginx -t || {
    echo "❌ Nginx configuration test failed!"
    exit 1
}

echo "🚀 Starting nginx reverse proxy..."
exec nginx -g "daemon off;"