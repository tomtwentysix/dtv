#!/bin/bash

# Docker Timeline Troubleshooting Script
# This script helps diagnose issues with timeline functionality in Docker containers

echo "🔧 dt.visuals Timeline Troubleshooting"
echo "====================================="

# Check if containers are running
echo "📋 Container Status:"
docker-compose ps

echo ""
echo "🔍 Checking Application Health:"
if curl -sf http://localhost:5000/api/health; then
    echo "✅ Application is responding"
    curl -s http://localhost:5000/api/health | jq '.' 2>/dev/null || curl -s http://localhost:5000/api/health
else
    echo "❌ Application is not responding"
fi

echo ""
echo "🗄️  Database Connection Test:"
if docker-compose exec -T app node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()').then(() => {
  console.log('✅ Database connection successful');
  process.exit(0);
}).catch(err => {
  console.log('❌ Database connection failed:', err.message);
  process.exit(1);
});
"; then
    echo "Database connectivity: OK"
else
    echo "Database connectivity: FAILED"
fi

echo ""
echo "📊 Timeline Tables Check:"
docker-compose exec -T app node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT COUNT(*) FROM media_timeline_notes').then(result => {
  console.log('✅ Timeline notes table exists, rows:', result.rows[0].count);
}).catch(err => {
  console.log('❌ Timeline notes table issue:', err.message);
});
pool.query('SELECT COUNT(*) FROM media').then(result => {
  console.log('✅ Media table exists, rows:', result.rows[0].count);
}).catch(err => {
  console.log('❌ Media table issue:', err.message);
});
"

echo ""
echo "🔗 API Endpoints Test:"
endpoints=(
    "/api/health"
    "/api/client/media/timeline-notes"
    "/api/user"
)

for endpoint in "${endpoints[@]}"; do
    if curl -sf "http://localhost:5000$endpoint" > /dev/null 2>&1; then
        echo "✅ $endpoint - OK"
    else
        echo "❌ $endpoint - FAILED"
    fi
done

echo ""
echo "📋 Recent Application Logs:"
docker-compose logs --tail=20 app

echo ""
echo "💾 Volume Status:"
docker volume ls | grep $(basename $(pwd))

echo ""
echo "🔧 Common Solutions:"
echo "1. Restart services: docker-compose restart"
echo "2. Rebuild containers: docker-compose up --build -d"
echo "3. Reset database: docker-compose down -v && docker-compose up -d"
echo "4. Check environment: docker-compose exec app env | grep DATABASE"
echo "5. Run migrations: docker-compose exec app npm run db:push"

echo ""
echo "🆘 If timeline functionality is still missing:"
echo "1. Check client permissions in database"
echo "2. Verify video files are accessible"
echo "3. Check browser console for JavaScript errors"
echo "4. Ensure proper CORS configuration"