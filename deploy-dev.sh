#!/bin/bash
set -e

# dt.visuals Development Environment Deployment Script
echo "🎬 dt.visuals Development Deployment"
echo "====================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create environment file if it doesn't exist
if [ ! -f .env.dev ]; then
    echo "❌ .env.dev file not found. Please create it first."
    exit 1
fi

echo "🔍 Pre-deployment checks..."

# Check if required files exist
required_files=("Dockerfile.dev" "docker-compose.dev.yml" "package.json")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Required file $file not found"
        exit 1
    fi
done

echo "✅ All required files present"

# Stop existing development containers
echo "🛑 Stopping existing development containers..."
docker-compose -f docker-compose.dev.yml down 2>/dev/null || true

# Build and start development services
echo "🏗️  Building development Docker image..."
docker-compose -f docker-compose.dev.yml build --no-cache

echo "🚀 Starting development services..."
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 15

# Check service health
echo "🔍 Checking service health..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✅ Development application is healthy!"
        break
    else
        echo "⏳ Attempt $attempt/$max_attempts - waiting for application..."
        sleep 2
        ((attempt++))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ Application failed to start within expected time"
    echo "📋 Checking logs:"
    docker-compose -f docker-compose.dev.yml logs app-dev
    exit 1
fi

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose -f docker-compose.dev.yml exec -T app-dev npm run db:push

echo ""
echo "🎉 Development deployment completed successfully!"
echo ""
echo "📱 Development Application Access:"
echo "   URL: http://localhost:3000"
echo "   Database: postgresql://postgres:devpassword@localhost:5433/dt_visuals_dev"
echo ""
echo "👥 Test Accounts:"
echo "   Admin: admin@dtvisuals.com / admin123"
echo "   Staff: staff@dtvisuals.com / staff123"
echo ""
echo "👤 Client Portal Accounts:"
echo "   Acme Corp: contact@acme.com / client123"
echo "   Creative Studios: hello@creativestudios.com / client123"
echo ""
echo "🎬 Development Features:"
echo "   - Hot reload enabled"
echo "   - Debug logging active"
echo "   - Timeline functionality"
echo "   - Media management"
echo "   - Dual authentication system (Admin/Staff + Client)"
echo "   - RBAC system with enhanced user management"
echo "   - Persistent database and uploads"
echo ""
echo "🛠️  Development Commands:"
echo "   View logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "   Stop: docker-compose -f docker-compose.dev.yml down"
echo "   Restart: docker-compose -f docker-compose.dev.yml restart"
echo "   Shell access: docker-compose -f docker-compose.dev.yml exec app-dev sh"