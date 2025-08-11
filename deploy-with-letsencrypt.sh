#!/bin/bash

echo "=== DT Visuals Production Deployment with Let's Encrypt ==="

# Configuration
STAGING=${1:-false}
FORCE_RENEW=${2:-false}

if [ "$STAGING" = "true" ]; then
    echo "🧪 Deploying with Let's Encrypt staging certificates"
else
    echo "🚀 Deploying with Let's Encrypt production certificates"
fi

# Pre-deployment checks
echo "🔍 Pre-deployment checks..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running or accessible"
    exit 1
fi

# Check if required files exist
required_files=(
    "docker-compose.dual.yml"
    "docker-compose.letsencrypt.yml" 
    "nginx.conf"
    "nginx-letsencrypt-startup.sh"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Required file missing: $file"
        exit 1
    fi
done

echo "✅ Pre-deployment checks passed"

# Stop any existing deployment
echo "🛑 Stopping existing deployment..."
docker-compose -f docker-compose.dual.yml down 2>/dev/null || true
docker-compose -f docker-compose.letsencrypt.yml down 2>/dev/null || true

# Clean up any orphaned containers
docker container prune -f > /dev/null 2>&1 || true

# Create network if it doesn't exist
echo "🌐 Setting up Docker network..."
docker network create dtvisuals-network 2>/dev/null || true

# Build images
echo "🔨 Building application images..."
docker-compose -f docker-compose.dual.yml build --no-cache

# Start databases first
echo "💾 Starting database services..."
docker-compose -f docker-compose.dual.yml up -d db-prod db-dev

# Wait for databases
echo "⏳ Waiting for databases to initialize..."
sleep 30

# Start applications
echo "🚀 Starting application services..."
docker-compose -f docker-compose.dual.yml up -d app-prod app-dev

# Wait for applications
echo "⏳ Waiting for applications to be ready..."
sleep 45

# Check if certificates exist or need renewal
CERT_PATH="./certbot/conf/live/dtvisuals.com/fullchain.pem"
NEED_CERT=true

if [ -f "$CERT_PATH" ] && [ "$FORCE_RENEW" != "true" ]; then
    # Check if certificate is valid for at least 30 days
    if openssl x509 -checkend 2592000 -noout -in "$CERT_PATH" 2>/dev/null; then
        echo "✅ Valid certificates found (30+ days remaining)"
        NEED_CERT=false
    else
        echo "⚠️  Certificates expire within 30 days - renewal needed"
    fi
fi

if [ "$NEED_CERT" = "true" ]; then
    echo "🔒 Setting up Let's Encrypt certificates..."
    if [ "$STAGING" = "true" ]; then
        ./setup-letsencrypt.sh true
    else
        ./setup-letsencrypt.sh false
    fi
    
    if [ $? -ne 0 ]; then
        echo "❌ Let's Encrypt setup failed!"
        echo "🔧 Falling back to self-signed certificates..."
        
        # Start with the enhanced nginx that creates self-signed certs
        docker-compose -f docker-compose.dual.yml up -d nginx
        sleep 10
        
        echo "⚠️  Deployment completed with self-signed certificates"
        echo "💡 Fix domain/DNS issues and run: ./setup-letsencrypt.sh"
        exit 0
    fi
else
    echo "🔒 Starting deployment with existing certificates..."
    docker-compose -f docker-compose.letsencrypt.yml up -d
fi

# Health checks
echo "🔍 Performing health checks..."
sleep 15

# Check nginx
if curl -k -s --connect-timeout 10 "https://localhost/api/health" > /dev/null; then
    echo "✅ HTTPS health check passed"
else
    echo "⚠️  HTTPS health check failed - checking logs..."
    docker logs dt-visuals-nginx --tail 20
fi

# Check HTTP redirect
if curl -s --connect-timeout 10 -I "http://localhost" | grep -q "301\|302"; then
    echo "✅ HTTP to HTTPS redirect working"
else
    echo "⚠️  HTTP redirect may have issues"
fi

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📋 Service Status:"
docker-compose -f docker-compose.letsencrypt.yml ps

echo ""
echo "🌐 Access URLs:"
echo "  • https://dtvisuals.com (Production)"
echo "  • https://dev.dtvisuals.com (Development)"
echo "  • http://dtvisuals.com (Redirects to HTTPS)"

echo ""
echo "🔒 Certificate Information:"
if [ -f "$CERT_PATH" ]; then
    echo "Certificate expires: $(openssl x509 -enddate -noout -in "$CERT_PATH" | cut -d= -f2)"
    echo "Certificate issuer: $(openssl x509 -issuer -noout -in "$CERT_PATH" | cut -d= -f2-)"
fi

echo ""
echo "🔧 Management Commands:"
echo "  • Renew certificates: ./renew-certificates.sh"
echo "  • View logs: docker-compose -f docker-compose.letsencrypt.yml logs -f"
echo "  • Stop deployment: docker-compose -f docker-compose.letsencrypt.yml down"