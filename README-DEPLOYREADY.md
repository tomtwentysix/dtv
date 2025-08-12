# DT Visuals - Production Deployment Branch

This branch contains only the files necessary for production deployment, with the database connection issues fixed.

## What's Fixed

- ✅ **Database Connection Error**: Fixed the issue where production deployments would attempt to use Neon WebSocket connections instead of local PostgreSQL
- ✅ **Environment Detection**: Improved environment detection to properly identify production deployments
- ✅ **dotenv Support**: Added proper .env file loading for environment variables
- ✅ **Deployment Ready**: Removed development-only files while keeping all deployment essentials

## Files Included

### Essential Runtime Files
- `dist/` - Built application (both server and client)
- `server/` - Server source code
- `shared/` - Shared schemas and types
- `migrations/` - Database migrations
- `uploads/` - File upload directory

### Configuration Files
- `.env` - Default environment configuration
- `.env.prod`, `.env.dev` - Environment-specific configurations
- `package.json` - Dependencies and scripts
- `drizzle.config.ts` - Database configuration
- `ecosystem.config.js` - PM2 process manager configuration
- `nginx.conf` - Web server configuration

### Setup Scripts
- `server-setup.sh` - Complete server setup script
- `ssl-setup.sh` - SSL certificate setup
- `deploy-live.sh` - Production deployment script

### Documentation
- `DEPLOYMENT_WALKTHROUGH.md` - Complete deployment guide
- `ROLLBACK.md` - Rollback procedures

## Quick Deployment

1. **Clone this branch on your server:**
   ```bash
   git clone -b deployready https://github.com/tomtwentysix/dtv.git
   cd dtv
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   # Copy and edit the production environment file
   cp .env.prod .env
   # Edit .env with your actual database credentials and settings
   nano .env
   ```

4. **Start the application:**
   ```bash
   npm start
   ```

## Environment Variables

The application now properly loads environment variables from `.env` files. Key variables:

- `NODE_ENV=production` - Sets production mode
- `DATABASE_URL` - PostgreSQL connection string
- `PORT=5000` - Server port
- `SESSION_SECRET` - Session encryption key (change in production!)

## Database Connection Fix

The original error was caused by incorrect environment detection. The application now properly detects production environments and uses local PostgreSQL instead of attempting Neon WebSocket connections.

### Before (Broken)
```
☁️ Using Neon serverless for Replit environment
❌ Schema check failed: connect ECONNREFUSED 127.0.0.1:443
```

### After (Fixed)
```
🐳 Using local PostgreSQL for Docker environment
🌍 Environment detected: docker
💾 Database: postgresql://...
```

## Production Checklist

- [ ] Set secure `SESSION_SECRET` in production
- [ ] Configure proper PostgreSQL database connection
- [ ] Set up SSL certificates using `ssl-setup.sh`
- [ ] Configure Nginx reverse proxy
- [ ] Set up PM2 for process management
- [ ] Configure proper backup procedures

For detailed setup instructions, see `DEPLOYMENT_WALKTHROUGH.md`.