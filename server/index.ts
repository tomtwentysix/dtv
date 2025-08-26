import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { initializeDatabase } from "./init-database.js";
import { log, serveStatic } from "./utils.js";

// Load environment variables from .env files
// In production, PM2 handles env_file loading, but this ensures it works in all environments
const nodeEnv = process.env.NODE_ENV || 'development';

console.log(`🔧 Environment: ${nodeEnv}`);
console.log(`🔧 Current working directory: ${process.cwd()}`);

if (nodeEnv === 'production') {
  // In production, PM2 loads environment via env_file parameter
  // We just log what PM2 should have loaded
  console.log(`ℹ️  Production mode - PM2 handles environment loading via ecosystem.config.js`);
  console.log(`ℹ️  Expected env_file: /var/www/dtvisuals/app/.env.prod`);
  
  // As a fallback, try to load .env.prod if it exists locally
  const envPath = path.resolve(process.cwd(), '.env.prod');
  try {
    if (fs.existsSync(envPath)) {
      console.log(`✅ Found local .env.prod, loading as backup: ${envPath}`);
      dotenv.config({ path: '.env.prod' });
    } else {
      console.log(`ℹ️  No local .env.prod found at ${envPath} - relying on PM2 env_file`);
    }
  } catch (error) {
    console.warn(`⚠️  Error checking for local .env.prod: ${error.message}`);
  }
} else {
  // In development/test, load appropriate env file
  const envFile = nodeEnv === 'test' ? '.env.test' : '.env.dev';
  console.log(`🔧 Loading environment from: ${envFile}`);
  
  const envPath = path.resolve(process.cwd(), envFile);
  try {
    if (fs.existsSync(envPath)) {
      console.log(`✅ Environment file exists: ${envPath}`);
      dotenv.config({ path: envFile });
    } else {
      console.warn(`⚠️  Environment file not found: ${envPath}`);
      // Fallback to .env
      dotenv.config({ path: '.env' });
    }
  } catch (error) {
    console.warn(`⚠️  Error loading environment file: ${error.message}`);
    // Fallback to .env
    dotenv.config({ path: '.env' });
  }
}

// Debug: Show critical environment variables after loading
console.log(`🔍 Environment Variables Status:`, {
  NODE_ENV: process.env.NODE_ENV || 'NOT SET',
  PORT: process.env.PORT || 'NOT SET',
  SMTP_HOST: process.env.SMTP_HOST ? `SET (${process.env.SMTP_HOST.substring(0, 20)}...)` : 'NOT SET',
  SMTP_FROM: process.env.SMTP_FROM ? `SET (${process.env.SMTP_FROM})` : 'NOT SET',
  SMTP_TO: process.env.SMTP_TO ? `SET (${process.env.SMTP_TO})` : 'NOT SET',
  DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET'
});

const app = express();

// Add CORS headers for Docker environment
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize database before starting the server
  try {
    console.log('🐘 Using PostgreSQL database connection');
    
    await initializeDatabase();
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    console.error('Server will continue but some features may not work properly');
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "development") {
    try {
      const { setupVite } = await import("./vite.js");
      await setupVite(app, server);
    } catch (error) {
      console.log("Vite setup not available, falling back to static serving");
      serveStatic(app);
    }
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5001', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
