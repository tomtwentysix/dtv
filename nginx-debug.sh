#!/bin/bash

echo "=== Nginx Debug Script ==="

echo "📦 Container Status:"
docker ps --filter "name=dt-visuals" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🔍 Checking app container health:"
docker exec dt-visuals-prod curl -f http://localhost:5000/api/health 2>/dev/null && echo "✅ Production app healthy" || echo "❌ Production app not responding"
docker exec dt-visuals-dev curl -f http://localhost:5000/api/health 2>/dev/null && echo "✅ Development app healthy" || echo "❌ Development app not responding"

echo ""
echo "🌐 Network connectivity test:"
docker exec dt-visuals-nginx nc -z app-prod 5000 && echo "✅ Nginx can reach app-prod:5000" || echo "❌ Nginx cannot reach app-prod:5000"
docker exec dt-visuals-nginx nc -z app-dev 5000 && echo "✅ Nginx can reach app-dev:5000" || echo "❌ Nginx cannot reach app-dev:5000"

echo ""
echo "📋 Nginx logs (last 20 lines):"
docker logs dt-visuals-nginx --tail 20

echo ""
echo "🔧 Nginx configuration test:"
docker exec dt-visuals-nginx nginx -t

echo ""
echo "🔄 Restarting nginx with proper startup script:"
docker restart dt-visuals-nginx

echo ""
echo "📋 New nginx logs:"
sleep 5
docker logs dt-visuals-nginx --tail 10