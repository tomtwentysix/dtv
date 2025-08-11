#!/bin/bash

echo "=== Fixing Database Connectivity Issues ==="

# Check current container status
echo "📦 Current Container Status:"
docker ps --filter "name=dt-visuals" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🔧 Stopping containers to restart with fresh configuration..."
docker-compose -f docker-compose.dual.yml down

echo ""
echo "🚀 Starting containers with database port exposure..."
docker-compose -f docker-compose.dual.yml up -d db-prod db-dev

echo ""
echo "⏳ Waiting for databases to start..."
sleep 10

echo ""
echo "📋 Checking database container ports:"
docker ps --filter "name=db-" --format "table {{.Names}}\t{{.Ports}}"

echo ""
echo "🔌 Checking if ports are listening on host:"
sudo netstat -tlnp | grep -E "(5433|5434)" || echo "Ports not yet bound to host"

echo ""
echo "🧪 Testing database connectivity:"

# Test from inside Docker network
echo "Testing internal connectivity..."
docker exec dt-visuals-db-prod pg_isready -U dtvisuals -d dt_visuals_prod && echo "✅ Production DB internal: OK" || echo "❌ Production DB internal: FAILED"
docker exec dt-visuals-db-dev pg_isready -U dtvisuals -d dt_visuals_dev && echo "✅ Development DB internal: OK" || echo "❌ Development DB internal: FAILED"

# Test from host
echo ""
echo "Testing external connectivity from host..."
timeout 5 nc -zv localhost 5433 2>&1 && echo "✅ Production port 5433: OK" || echo "❌ Production port 5433: FAILED"
timeout 5 nc -zv localhost 5434 2>&1 && echo "✅ Development port 5434: OK" || echo "❌ Development port 5434: FAILED"

echo ""
echo "🔧 If external connectivity failed, trying to restart with explicit bind..."
docker-compose -f docker-compose.dual.yml down
sleep 2

# Create temporary compose file with explicit host binding
cat > docker-compose.temp.yml << 'EOF'
version: '3.8'

services:
  db-prod:
    image: postgres:15-alpine
    container_name: dt-visuals-db-prod
    restart: unless-stopped
    ports:
      - "0.0.0.0:5433:5432"
    environment:
      - POSTGRES_DB=dt_visuals_prod
      - POSTGRES_USER=dtvisuals
      - POSTGRES_PASSWORD=${PROD_DB_PASSWORD}
    volumes:
      - db-prod-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dtvisuals -d dt_visuals_prod"]
      interval: 30s
      timeout: 10s
      retries: 3

  db-dev:
    image: postgres:15-alpine
    container_name: dt-visuals-db-dev
    restart: unless-stopped
    ports:
      - "0.0.0.0:5434:5432"
    environment:
      - POSTGRES_DB=dt_visuals_dev
      - POSTGRES_USER=dtvisuals
      - POSTGRES_PASSWORD=${DEV_DB_PASSWORD}
    volumes:
      - db-dev-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dtvisuals -d dt_visuals_dev"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  db-prod-data:
    driver: local
    name: dt-visuals-db-prod
  db-dev-data:
    driver: local
    name: dt-visuals-db-dev
EOF

echo "🚀 Starting databases with explicit 0.0.0.0 binding..."
docker-compose -f docker-compose.temp.yml up -d

echo ""
echo "⏳ Waiting for databases to start..."
sleep 15

echo ""
echo "📋 Final connectivity test:"
timeout 5 nc -zv localhost 5433 && echo "✅ Production port 5433: NOW WORKING" || echo "❌ Production port 5433: Still failed"
timeout 5 nc -zv localhost 5434 && echo "✅ Development port 5434: NOW WORKING" || echo "❌ Development port 5434: Still failed"

echo ""
echo "🔧 Connection details for external access:"
echo "Production: psql -h $(hostname -I | awk '{print $1}') -p 5433 -U dtvisuals -d dt_visuals_prod"
echo "Development: psql -h $(hostname -I | awk '{print $1}') -p 5434 -U dtvisuals -d dt_visuals_dev"

# Cleanup temp file
rm -f docker-compose.temp.yml