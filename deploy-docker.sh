#!/bin/bash
set -e

# Deploy dt.visuals with Timeline Functionality in Docker
# This script ensures timeline features work properly in containerized environments

echo "🎬 dt.visuals Docker Deployment Script"
echo "======================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cp .env.docker .env
    echo "✅ Environment file created. Please edit .env with your specific values."
    echo "   Important: Set DATABASE_URL and SESSION_SECRET before continuing."
    read -p "Press Enter when you've configured .env..."
fi

# Source environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
fi

# Validate critical environment variables
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set in .env file"
    exit 1
fi

if [ -z "$SESSION_SECRET" ]; then
    echo "❌ SESSION_SECRET is not set in .env file"
    exit 1
fi

echo "🔍 Pre-deployment checks..."

# Check if required files exist
required_files=("Dockerfile" "docker-compose.yml" "package.json")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Required file $file not found"
        exit 1
    fi
done

echo "✅ All required files present"

# Create uploads directory
echo "📁 Setting up directories..."
mkdir -p uploads
chmod 755 uploads

# Build and start services
echo "🏗️  Building Docker image..."
docker-compose build --no-cache

echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🔍 Checking service health..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -sf http://localhost:5000/api/health > /dev/null 2>&1; then
        echo "✅ Application is healthy!"
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
    docker-compose logs app
    exit 1
fi

# Test database connectivity and run migrations
echo "🗄️  Setting up database..."
if docker-compose exec -T app npm run db:push; then
    echo "✅ Database migrations completed"
else
    echo "❌ Database migrations failed"
    docker-compose logs app
    exit 1
fi

# Test timeline functionality specifically
echo "🕒 Testing timeline functionality..."
health_response=$(curl -s http://localhost:5000/api/health)
if echo "$health_response" | grep -q "timeline_functionality.*enabled"; then
    echo "✅ Timeline functionality is enabled"
else
    echo "⚠️  Timeline functionality status unclear. Response: $health_response"
fi

# Display deployment information
echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo "🌐 Application URL: http://localhost:5000"
echo "🔍 Health Check: http://localhost:5000/api/health"
echo "📊 Docker Status: docker-compose ps"
echo "📋 View Logs: docker-compose logs -f app"
echo ""
echo "👥 Test Accounts:"
echo "   Admin: admin@dtvisuals.com / admin123"
echo "   Staff: staff@dtvisuals.com / staff123"
echo "   Client: client@example.com / client123"
echo ""
echo "🕒 Timeline Features Available:"
echo "   - Video timestamp notes"
echo "   - Timeline navigation"
echo "   - Client feedback system"
echo "   - Media annotation tools"
echo ""
echo "🛠️  Management Commands:"
echo "   Stop: docker-compose down"
echo "   Restart: docker-compose restart"
echo "   Update: git pull && docker-compose up --build -d"
echo "   Logs: docker-compose logs -f"
echo ""
echo "For troubleshooting timeline issues, see: docker-deployment-guide.md"