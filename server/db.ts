import * as schema from "../shared/schema.js";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Check if we're in Docker environment (local PostgreSQL)
// Default to PostgreSQL for production or any postgresql:// connection string
const isDockerEnvironment = process.env.DOCKER_ENV === 'true' || 
  process.env.DATABASE_URL?.includes('postgres-prod') || 
  process.env.DATABASE_URL?.includes('postgres-dev') || 
  process.env.DATABASE_URL?.includes('db-prod') || 
  process.env.DATABASE_URL?.includes('db-dev') ||
  process.env.NODE_ENV === 'production' ||
  (process.env.DATABASE_URL?.startsWith('postgresql://') && !process.env.DATABASE_URL?.includes('neon'));

// Initialize database connection based on environment
async function initDB() {
  if (isDockerEnvironment) {
    // For Docker environments (dev/prod), use standard PostgreSQL
    console.log('🐳 Using local PostgreSQL for Docker environment');
    const { Pool } = await import('pg');
    const { drizzle } = await import('drizzle-orm/node-postgres');
    
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle({ client: pool, schema });
    
    return { pool, db };
  } else {
    // For Replit environment only, use Neon
    console.log('☁️  Using Neon serverless for Replit environment');
    const { Pool, neonConfig } = await import('@neondatabase/serverless');
    const { drizzle } = await import('drizzle-orm/neon-serverless');
    const ws = await import('ws');
    
    neonConfig.webSocketConstructor = ws.default;
    
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle({ client: pool, schema });
    
    return { pool, db };
  }
}

// Initialize and export database connection
const { pool, db } = await initDB();

export { pool, db };
