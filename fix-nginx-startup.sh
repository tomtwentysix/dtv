#!/bin/bash

echo "=== Fixing Nginx Startup Issues ==="

# Stop all containers to restart fresh
echo "🛑 Stopping all containers..."
docker-compose -f docker-compose.dual.yml down

# Ensure the startup script has proper permissions
echo "🔧 Setting proper permissions on nginx startup script..."
chmod +x nginx-startup.sh

# Remove any cached nginx container
echo "🗑️  Removing any cached nginx container..."
docker rm dt-visuals-nginx 2>/dev/null || true

# Start services in proper order
echo "🚀 Starting databases first..."
docker-compose -f docker-compose.dual.yml up -d db-prod db-dev

echo "⏳ Waiting for databases to be ready..."
sleep 15

echo "🚀 Starting applications..."
docker-compose -f docker-compose.dual.yml up -d app-prod app-dev

echo "⏳ Waiting for applications to be ready..."
sleep 30

# Check app health before starting nginx
echo "🔍 Checking application health..."
docker exec dt-visuals-prod curl -f http://localhost:5000/api/health 2>/dev/null && echo "✅ Production app ready" || echo "❌ Production app not ready"
docker exec dt-visuals-dev curl -f http://localhost:5000/api/health 2>/dev/null && echo "✅ Development app ready" || echo "❌ Development app not ready"

echo "🚀 Starting nginx with custom startup script..."
docker-compose -f docker-compose.dual.yml up -d nginx

echo "📋 Monitoring nginx startup..."
sleep 10

# Check nginx logs
echo "📋 Nginx startup logs:"
docker logs dt-visuals-nginx --tail 20

echo ""
echo "📦 Final container status:"
docker ps --filter "name=dt-visuals" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🔧 Testing nginx configuration:"
docker exec dt-visuals-nginx nginx -t 2>/dev/null && echo "✅ Nginx config valid" || echo "❌ Nginx config invalid"

echo ""
echo "🌐 Testing external access:"
curl -I http://localhost:8080 2>/dev/null && echo "✅ Port 8080 accessible" || echo "❌ Port 8080 not accessible"