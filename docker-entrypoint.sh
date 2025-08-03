#!/bin/sh
set -e

# Wait for database to be ready
until node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT 1').then(() => {
  console.log('Database connection successful');
  process.exit(0);
}).catch(err => {
  console.log('Database connection failed:', err.message);
  process.exit(1);
});
" > /dev/null 2>&1; do
  echo "Waiting for database to be ready..."
  sleep 2
done

echo "Database is ready. Starting application..."

# Run database migrations
npm run db:push

# Start the application
exec npm start