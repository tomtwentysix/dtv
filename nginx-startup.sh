#!/bin/sh

echo "Waiting for app containers to be ready..."

# Function to check if a service is responding using wget
check_service() {
    local host=$1
    local port=$2
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if wget -q --spider --timeout=2 "http://$host:$port/api/health" 2>/dev/null; then
            echo "✅ $host:$port is ready"
            return 0
        fi
        echo "⏳ Waiting for $host:$port... (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ $host:$port failed to become ready after $max_attempts attempts"
    echo "🚀 Starting nginx anyway..."
    return 0  # Continue even if services aren't ready
}

# Wait for both app services
check_service "app-prod" "5000"
check_service "app-dev" "5000"

echo "🚀 Starting nginx..."
exec nginx -g "daemon off;"