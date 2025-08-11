#!/bin/bash

echo "=== Schema vs Migration Comparison ==="

echo "📋 Tables in current schema (shared/schema.ts):"
grep -o "export const [a-zA-Z]* = pgTable" shared/schema.ts | sed 's/export const //g' | sed 's/ = pgTable//g'

echo ""
echo "📋 Tables in migration (migrations/0000_wonderful_mister_fear.sql):"
grep "CREATE TABLE" migrations/0000_wonderful_mister_fear.sql | sed 's/CREATE TABLE "//g' | sed 's/" (.*//g'

echo ""
echo "🔍 Missing from migration:"
SCHEMA_TABLES=$(grep -o "export const [a-zA-Z]* = pgTable" shared/schema.ts | sed 's/export const //g' | sed 's/ = pgTable//g' | sort)
MIGRATION_TABLES=$(grep "CREATE TABLE" migrations/0000_wonderful_mister_fear.sql | sed 's/CREATE TABLE "//g' | sed 's/" (.*//g' | sort)

# Find tables in schema but not in migration
for table in $SCHEMA_TABLES; do
    if ! echo "$MIGRATION_TABLES" | grep -q "^$table$"; then
        echo "❌ Missing: $table"
    fi
done

echo ""
echo "🔍 Extra in migration (not in current schema):"
for table in $MIGRATION_TABLES; do
    if ! echo "$SCHEMA_TABLES" | grep -q "^$table$"; then
        echo "⚠️  Extra: $table"
    fi
done

echo ""
echo "🔧 To fix missing tables, we need to:"
echo "1. Run: drizzle-kit generate"
echo "2. Or manually add missing table definitions to the migration"