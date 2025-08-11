#!/bin/bash

# Run Drizzle migrations with proper environment loading
# Usage: ./run-migration-with-env.sh [prod|dev]

ENVIRONMENT=${1:-prod}

if [[ "$ENVIRONMENT" != "prod" && "$ENVIRONMENT" != "dev" ]]; then
    echo "Usage: $0 [prod|dev]"
    echo "Example: $0 prod"
    exit 1
fi

cd /var/www/dtvisuals/app

# Check if environment file exists
ENV_FILE=".env.$ENVIRONMENT"
if [[ ! -f "$ENV_FILE" ]]; then
    echo "❌ Environment file $ENV_FILE not found!"
    echo "Run: sudo ./setup-env-server.sh first"
    exit 1
fi

echo "🗃️  Running database migrations for $ENVIRONMENT environment..."
echo "📁 Using environment file: $ENV_FILE"

# Load environment variables and run migration
set -a  # Automatically export all variables
source "$ENV_FILE"
set +a  # Stop auto-exporting

# Verify DATABASE_URL is set
if [[ -z "$DATABASE_URL" ]]; then
    echo "❌ DATABASE_URL not found in $ENV_FILE"
    echo "Please configure the database URL in $ENV_FILE"
    exit 1
fi

echo "🔗 Database: ${DATABASE_URL/postgresql:\/\/*/postgresql://***:***@***}"
echo "🏃 Running migration..."

# Run the migration
npx drizzle-kit migrate

if [[ $? -eq 0 ]]; then
    echo "✅ Migration completed successfully for $ENVIRONMENT environment!"
else
    echo "❌ Migration failed!"
    exit 1
fi