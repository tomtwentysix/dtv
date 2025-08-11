#!/bin/bash

echo "=== Fixing Production Database Schema ==="

# Stop and remove the production database container to force recreation
echo "🛑 Stopping production database..."
docker stop dt-visuals-db-prod || true
docker rm dt-visuals-db-prod || true

# Remove the production database volume to start fresh
echo "🗑️  Removing production database volume..."
docker volume rm dt-visuals-db-prod || true

# Restart the entire stack to recreate the production database
echo "🔄 Restarting Docker stack..."
docker-compose -f docker-compose.dual.yml down
docker-compose -f docker-compose.dual.yml up -d

echo "✅ Production database should now be recreated with proper schema"
echo "📋 Checking logs..."
sleep 10
docker logs dt-visuals-prod --tail 20