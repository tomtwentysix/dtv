#!/bin/bash

echo "=== Resetting Production Database ==="

# Get environment variables
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create it from .env.dual template"
    exit 1
fi

source .env

# Stop the production app and database
echo "🛑 Stopping production containers..."
docker stop dt-visuals-prod dt-visuals-db-prod 2>/dev/null || true

# Remove production database volume to force fresh creation
echo "🗑️  Removing production database volume..."
docker volume rm dt-visuals-db-prod 2>/dev/null || true

# Restart just the production database first
echo "🚀 Starting fresh production database..."
docker-compose -f docker-compose.dual.yml up -d db-prod

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Now start the production app which will create the schema
echo "🚀 Starting production app..."
docker-compose -f docker-compose.dual.yml up -d app-prod

# Wait and check logs
echo "📋 Waiting for app to initialize..."
sleep 20

echo "=== Production App Logs ==="
docker logs dt-visuals-prod --tail 30

echo ""
echo "=== Database Check ==="
echo "Testing database connection..."
docker exec dt-visuals-db-prod psql -U dtvisuals -d dt_visuals_prod -c "\dt" || echo "Tables not created yet"