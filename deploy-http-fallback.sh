#!/bin/bash

echo "=== DT Visuals HTTP Fallback Deployment ==="
echo "This deployment works without SSL certificates and falls back to HTTP"

# Pre-deployment checks
echo "🔍 Pre-deployment checks..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running or accessible"
    exit 1
fi

echo "✅ Docker is available"

# Stop any existing deployment
echo "🛑 Stopping existing deployment..."
docker-compose -f docker-compose.dual.yml down 2>/dev/null || true
docker-compose -f docker-compose.ssl-fallback.yml down 2>/dev/null || true

# Clean up
docker container prune -f > /dev/null 2>&1 || true

# Create network if it doesn't exist
echo "🌐 Setting up Docker network..."
docker network create dt-visuals-network 2>/dev/null || true

# Build images
echo "🔨 Building application images..."
docker-compose -f docker-compose.ssl-fallback.yml build --no-cache

# Start databases first
echo "💾 Starting database services..."
docker-compose -f docker-compose.ssl-fallback.yml up -d db-prod db-dev

echo "⏳ Waiting for databases to initialize..."
sleep 30

# Start applications
echo "🚀 Starting application services..."
docker-compose -f docker-compose.ssl-fallback.yml up -d app-prod app-dev

echo "⏳ Waiting for applications to be ready..."
sleep 30

# Start nginx with HTTP fallback
echo "🌐 Starting nginx with automatic HTTP fallback..."
docker-compose -f docker-compose.ssl-fallback.yml up -d nginx

# Wait and check status
echo "⏳ Waiting for services to stabilize..."
sleep 15

echo ""
echo "📋 Deployment Status:"
docker-compose -f docker-compose.ssl-fallback.yml ps

echo ""
echo "🌐 Access URLs (HTTP only):"
echo "  • http://dtvisuals.com (Production) - Port 8080"
echo "  • http://dev.dtvisuals.com (Development) - Port 8080"
echo "  • Local access: http://localhost:8080"

echo ""
echo "📋 Service Health Checks:"
if curl -s --connect-timeout 5 "http://localhost:8080" > /dev/null; then
    echo "  ✅ HTTP service responding"
else
    echo "  ⚠️  HTTP service not responding yet"
fi

echo ""
echo "🔧 To add SSL later:"
echo "  1. Ensure domain DNS points to this server"
echo "  2. Run: ./deploy-with-letsencrypt.sh"
echo "  3. This will upgrade to HTTPS automatically"

echo ""
echo "📊 View logs: docker-compose -f docker-compose.ssl-fallback.yml logs -f"
echo "🛑 Stop: docker-compose -f docker-compose.ssl-fallback.yml down"