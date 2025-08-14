import * as schema from "@shared/schema";
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Use PostgreSQL for all environments - production ready and reliable
console.log('🐘 Using PostgreSQL database connection');

// Initialize PostgreSQL connection with proper configuration
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Add connection pool configuration for production reliability
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection could not be established
});

// Handle connection errors gracefully
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

const db = drizzle({ client: pool, schema });

export { pool, db };
