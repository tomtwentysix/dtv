#!/bin/bash

echo "=== Database Schema Comparison ==="

echo "📋 Development Database (Replit Neon):"
echo "Schemas:"
echo "- public (application tables)"
echo "- drizzle (migration tracking)"

echo ""
echo "📋 Production Database Check:"
if docker exec dt-visuals-db-prod pg_isready -U dtvisuals -d dt_visuals_prod >/dev/null 2>&1; then
    echo "✅ Production database is accessible"
    
    echo ""
    echo "Schemas in production:"
    docker exec dt-visuals-db-prod psql -U dtvisuals -d dt_visuals_prod -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast');" 2>/dev/null
    
    echo ""
    echo "Tables in production:"
    docker exec dt-visuals-db-prod psql -U dtvisuals -d dt_visuals_prod -c "SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast') ORDER BY table_schema, table_name;" 2>/dev/null
    
    echo ""
    echo "🔍 Migration tracking status:"
    docker exec dt-visuals-db-prod psql -U dtvisuals -d dt_visuals_prod -c "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'drizzle' AND table_name = '__drizzle_migrations');" 2>/dev/null
    
else
    echo "❌ Production database not accessible"
    echo "Try: docker-compose -f docker-compose.dual.yml up -d db-prod"
fi

echo ""
echo "💡 Analysis:"
echo "The drizzle schema should contain migration tracking tables."
echo "If missing, it means migrations weren't run properly in production."