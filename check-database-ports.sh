#!/bin/bash

echo "=== Database Port Connectivity Check ==="

# Check if containers are running
echo "📦 Container Status:"
docker ps --filter "name=dt-visuals" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🔌 Network Port Check:"
# Check if ports are actually listening on the host
netstat -tlnp | grep -E "(5433|5434)" || echo "Ports 5433/5434 not listening on host"

echo ""
echo "🐳 Docker Network Check:"
# Check docker network connectivity
docker network ls | grep dt-visuals

echo ""
echo "📋 Database Container Details:"
docker inspect dt-visuals-db-prod --format='{{.NetworkSettings.Ports}}' 2>/dev/null || echo "Production DB container not found"
docker inspect dt-visuals-db-dev --format='{{.NetworkSettings.Ports}}' 2>/dev/null || echo "Development DB container not found"

echo ""
echo "🔍 Testing Internal Connectivity:"
# Test connection from inside the network
docker exec dt-visuals-db-prod pg_isready -U dtvisuals -d dt_visuals_prod 2>/dev/null && echo "✅ Production DB internal: OK" || echo "❌ Production DB internal: FAILED"
docker exec dt-visuals-db-dev pg_isready -U dtvisuals -d dt_visuals_dev 2>/dev/null && echo "✅ Development DB internal: OK" || echo "❌ Development DB internal: FAILED"