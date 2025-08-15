import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { initializeDatabase, getEnvironmentInfo } from "./init-database.js";
import { log, serveStatic } from "./utils.js";

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

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

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
    const envInfo = getEnvironmentInfo();
    console.log(`🌍 Environment detected: ${envInfo.environment}`);
    console.log(`💾 Database: ${envInfo.databaseUrl?.substring(0, 50)}...`);
    
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

  // Set different default ports based on environment
  const defaultPort = process.env.NODE_ENV === "development" ? '5002' : '5001';
  const port = parseInt(process.env.PORT || defaultPort, 10);
  
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port} in ${process.env.NODE_ENV || 'production'} mode`);
  });
})();
