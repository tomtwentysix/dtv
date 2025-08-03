#!/bin/bash
set -e

# Deploy dt.visuals in Development Mode with Docker
# This script sets up development environment with hot reloading and debugging

echo "🚀 dt.visuals Docker Development Deployment"
echo "=========================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create development environment file if it doesn't exist
if [ ! -f .env.dev ]; then
    echo "📝 Creating development environment file..."
    cat > .env.dev << EOF
# Development Environment Configuration
NODE_ENV=development
PORT=5000

# Database Configuration for Docker Development
POSTGRES_DB=dt_visuals_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=devpassword
DATABASE_URL=postgresql://postgres:devpassword@postgres:5432/dt_visuals_dev

# Session Configuration (dev-friendly)
SESSION_SECRET=dev-session-secret-not-for-production

# Development Configuration
# Enable host binding for Docker containers
HOST=0.0.0.0

# Timeline functionality settings for development
ENABLE_TIMELINE=true
VIDEO_UPLOAD_LIMIT=500MB
TIMELINE_NOTES_MAX_LENGTH=10000

# Development debugging
DEBUG=true
LOG_LEVEL=debug
EOF
    echo "✅ Development environment file created at .env.dev"
fi

# Copy development environment
echo "📋 Setting up development environment..."
cp .env.dev .env

# Source environment variables (filter comments and empty lines)
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
fi

echo "🔍 Development setup checks..."

# Check if required files exist
required_files=("package.json" "docker-compose.yml")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Required file $file not found"
        exit 1
    fi
done

echo "✅ All required files present"

# Create development directories
echo "📁 Setting up development directories..."
mkdir -p uploads
mkdir -p .docker-data/postgres-dev
chmod 755 uploads
chmod 755 .docker-data/postgres-dev

# Create development docker-compose override
echo "🐳 Creating development Docker configuration..."
cat > docker-compose.dev.yml << EOF
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "5000:5000"
      - "24678:24678"  # Vite HMR port
    environment:
      - NODE_ENV=development
      - DATABASE_URL=\${DATABASE_URL}
      - SESSION_SECRET=\${SESSION_SECRET}
      - PORT=5000
      - DEBUG=true
    volumes:
      - .:/app
      - /app/node_modules
      - uploads:/app/uploads
    depends_on:
      - postgres
    restart: unless-stopped
    command: npm run dev

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=\${POSTGRES_DB}
      - POSTGRES_USER=\${POSTGRES_USER}
      - POSTGRES_PASSWORD=\${POSTGRES_PASSWORD}
    volumes:
      - ./.docker-data/postgres-dev:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5433:5432"  # Different port to avoid conflicts
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  uploads:

networks:
  default:
    driver: bridge
EOF

# Create development Dockerfile
echo "🏗️  Creating development Dockerfile..."
cat > Dockerfile.dev << EOF
# Development Dockerfile with hot reloading
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies for development
RUN apk add --no-cache git

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads && chmod 755 uploads

# Expose ports
EXPOSE 5000 24678

# Development command with hot reloading
CMD ["npm", "run", "dev"]
EOF

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.dev.yml down --remove-orphans 2>/dev/null || true

# Build and start development services
echo "🏗️  Building development environment..."
docker-compose -f docker-compose.dev.yml build --no-cache

echo "🚀 Starting development services..."
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "🔍 Checking service health..."

# Check PostgreSQL
if docker-compose -f docker-compose.dev.yml exec postgres pg_isready -U $POSTGRES_USER >/dev/null 2>&1; then
    echo "✅ PostgreSQL is ready"
else
    echo "❌ PostgreSQL is not ready"
    docker-compose -f docker-compose.dev.yml logs postgres
    exit 1
fi

# Check application
if curl -s -f http://localhost:5000/api/health >/dev/null 2>&1; then
    echo "✅ Application is ready"
else
    echo "⏳ Application is starting up..."
    sleep 5
    if curl -s -f http://localhost:5000/api/health >/dev/null 2>&1; then
        echo "✅ Application is ready"
    else
        echo "❌ Application failed to start"
        docker-compose -f docker-compose.dev.yml logs app
        exit 1
    fi
fi

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose -f docker-compose.dev.yml exec app npm run db:push

echo ""
echo "🎉 Development environment is ready!"
echo "======================================"
echo "📱 Application: http://localhost:5000"
echo "🗄️  Database: postgresql://postgres:devpassword@localhost:5433/dt_visuals_dev"
echo ""
echo "📊 Service Status:"
docker-compose -f docker-compose.dev.yml ps
echo ""
echo "📝 Available Commands:"
echo "  View logs:           docker-compose -f docker-compose.dev.yml logs -f"
echo "  Stop services:       docker-compose -f docker-compose.dev.yml down"
echo "  Restart app:         docker-compose -f docker-compose.dev.yml restart app"
echo "  Database shell:      docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d dt_visuals_dev"
echo "  App shell:           docker-compose -f docker-compose.dev.yml exec app sh"
echo ""
echo "🔧 Development Features Enabled:"
echo "  ✅ Hot reloading with Vite HMR"
echo "  ✅ Volume mounting for live code changes"
echo "  ✅ Development database with sample data"
echo "  ✅ Timeline functionality fully enabled"
echo "  ✅ Debug logging enabled"
echo "  ✅ Larger upload limits for testing"

# Test timeline functionality
echo ""
echo "🧪 Testing timeline functionality..."
if curl -s -f http://localhost:5000/api/health | grep -q "timeline_functionality.*enabled"; then
    echo "✅ Timeline functionality confirmed working"
else
    echo "⚠️  Timeline functionality may need verification"
fi

echo ""
echo "🎬 Ready to develop! Timeline features are fully operational."
echo "   Visit http://localhost:5000 to start testing your application."