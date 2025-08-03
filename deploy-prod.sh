#!/bin/bash
set -e

# dt.visuals Production Environment Deployment Script
echo "🎬 dt.visuals Production Deployment"
echo "===================================="

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
if [ ! -f .env.prod ]; then
    echo "❌ .env.prod file not found. Please create it first."
    echo "📝 Make sure to set secure values for:"
    echo "   - PROD_SESSION_SECRET"
    echo "   - PROD_POSTGRES_PASSWORD"
    exit 1
fi

# Source environment variables
export $(cat .env.prod | grep -v '^#' | grep -v '^$' | xargs)

# Validate critical environment variables
if [ -z "$PROD_SESSION_SECRET" ] || [ "$PROD_SESSION_SECRET" = "prod-session-secret-key-change-this-to-secure-random-string" ]; then
    echo "❌ PROD_SESSION_SECRET is not set to a secure value in .env.prod file"
    echo "   Please set a secure random string for production use"
    exit 1
fi

echo "🔍 Pre-deployment checks..."

# Check if required files exist
required_files=("Dockerfile.prod" "docker-compose.prod.yml" "package.json")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Required file $file not found"
        exit 1
    fi
done

echo "✅ All required files present"

# Warning for production deployment
echo "⚠️  Production Deployment Warning"
echo "   This will deploy to production environment."
echo "   Make sure you have:"
echo "   - Set secure passwords in .env.prod"
echo "   - Configured proper session secrets"
echo "   - Backed up any existing data"
echo ""
read -p "Continue with production deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Production deployment cancelled"
    exit 1
fi

# Stop existing production containers
echo "🛑 Stopping existing production containers..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# Build and start production services
echo "🏗️  Building production Docker image..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "🚀 Starting production services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 20

# Check service health
echo "🔍 Checking service health..."
max_attempts=60
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -sf http://localhost:5000/api/health > /dev/null 2>&1; then
        echo "✅ Production application is healthy!"
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
    docker-compose -f docker-compose.prod.yml logs app-prod
    exit 1
fi

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T app-prod npm run db:push

echo ""
echo "🎉 Production deployment completed successfully!"
echo ""
echo "📱 Production Application Access:"
echo "   URL: http://localhost:5000"
echo "   Database: postgresql://postgres:***@localhost:5432/dt_visuals_prod"
echo ""
echo "👥 Test Accounts:"
echo "   Admin: admin@dtvisuals.com / admin123"
echo "   Staff: staff@dtvisuals.com / staff123"
echo "   Client: client@example.com / client123"
echo ""
echo "🎬 Production Features:"
echo "   - Optimized build"
echo "   - Health monitoring"
echo "   - Timeline functionality"
echo "   - Media management"
echo "   - RBAC system"
echo ""
echo "🛠️  Production Commands:"
echo "   View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   Stop: docker-compose -f docker-compose.prod.yml down"
echo "   Restart: docker-compose -f docker-compose.prod.yml restart"
echo "   Shell access: docker-compose -f docker-compose.prod.yml exec app-prod sh"
echo ""
echo "🔒 Security Reminders:"
echo "   - Change default passwords in production"
echo "   - Use secure session secrets"
echo "   - Monitor logs regularly"
echo "   - Keep containers updated"