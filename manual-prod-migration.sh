#!/bin/bash

# Manual production database migration script
echo "=== Manual Production Database Migration ==="

# Get the production container ID
PROD_CONTAINER=$(docker ps --filter "name=dt-visuals-prod" --format "{{.ID}}")

if [ -z "$PROD_CONTAINER" ]; then
    echo "❌ Production container not found"
    exit 1
fi

echo "📦 Found production container: $PROD_CONTAINER"

# Run migration inside the production container
echo "🔧 Running database migration..."
docker exec -it "$PROD_CONTAINER" sh -c "npm run db:push"

if [ $? -eq 0 ]; then
    echo "✅ Production database migration completed successfully"
    echo "🔄 Restarting production container..."
    docker restart "$PROD_CONTAINER"
else
    echo "❌ Production database migration failed"
    echo "📋 Checking container logs..."
    docker logs "$PROD_CONTAINER" --tail 20
fi