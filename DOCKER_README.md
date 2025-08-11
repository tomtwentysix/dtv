# Docker Deployment Guide for dt.visuals

This guide provides comprehensive instructions for deploying the dt.visuals cinematic media production platform using Docker Desktop on Windows, with separate development and production environments.

## Overview

The Docker setup includes:
- **Development Environment**: Hot reload, debug logging, port 3000
- **Production Environment**: Optimized build, health monitoring, port 5000
- **Separate Databases**: Independent PostgreSQL databases for each environment
- **Persistent Storage**: Separate upload folders that survive container restarts
- **Same Database Server**: Both environments use the same PostgreSQL server with different databases

## Quick Start

### Prerequisites
- Docker Desktop for Windows installed and running
- At least 4GB RAM available for containers
- Ports 3000, 5000, 5432, and 5433 available

### Development Environment
```bash
# Deploy development environment
./deploy-dev.sh

# Access at: http://localhost:3000
# Database: postgresql://postgres:devpassword@localhost:5433/dt_visuals_dev
```

### Production Environment
```bash
# Configure secure passwords first
cp .env.prod .env.prod.local
# Edit .env.prod.local with secure passwords

# Deploy production environment
./deploy-prod.sh

# Access at: http://localhost:5000
# Database: postgresql://postgres:***@localhost:5432/dt_visuals_prod
```

## Architecture

### Container Structure
```
┌─ Development Environment ─┐    ┌─ Production Environment ─┐
│ dt-visuals-dev (port 3000) │    │ dt-visuals-prod (port 5000) │
│ postgres-dev (port 5433)   │    │ postgres-prod (port 5432)   │
└─────────────────────────────┘    └──────────────────────────────┘
              │                                    │
              ▼                                    ▼
    ┌─ Shared PostgreSQL Server ─┐
    │ dt_visuals_dev database    │
    │ dt_visuals_prod database   │
    └──────────────────────────────┘
```

### Volume Configuration
- **Development Uploads**: `dt-visuals-uploads-dev` volume
- **Production Uploads**: `dt-visuals-uploads-prod` volume
- **Development Database**: `dt-visuals-postgres-dev-data` volume
- **Production Database**: `dt-visuals-postgres-prod-data` volume

## Environment Configuration

### Development (.env.dev)
```env
NODE_ENV=development
PORT=5000
HOST=0.0.0.0

# Development Database
DEV_POSTGRES_DB=dt_visuals_dev
DEV_POSTGRES_USER=postgres
DEV_POSTGRES_PASSWORD=devpassword
DATABASE_URL=postgresql://postgres:devpassword@postgres-dev:5432/dt_visuals_dev

# Development Session
DEV_SESSION_SECRET=dev-session-secret-key-for-development-only

# Features
ENABLE_TIMELINE=true
VIDEO_UPLOAD_LIMIT=100MB
DEBUG=true
```

### Production (.env.prod)
```env
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Production Database
PROD_POSTGRES_DB=dt_visuals_prod
PROD_POSTGRES_USER=postgres
PROD_POSTGRES_PASSWORD=prodpassword  # CHANGE THIS!
DATABASE_URL=postgresql://postgres:prodpassword@postgres-prod:5432/dt_visuals_prod

# Production Session
PROD_SESSION_SECRET=prod-session-secret-key-change-this-to-secure-random-string  # CHANGE THIS!

# Features
ENABLE_TIMELINE=true
VIDEO_UPLOAD_LIMIT=100MB
DEBUG=false
```

## Management Commands

### Using docker-management.sh
```bash
# Start environments
./docker-management.sh start dev     # Start development
./docker-management.sh start prod    # Start production

# Stop environments
./docker-management.sh stop dev      # Stop development
./docker-management.sh stop prod     # Stop production

# View logs
./docker-management.sh logs dev      # Development logs
./docker-management.sh logs prod     # Production logs

# Container status
./docker-management.sh status        # Show all containers

# Database operations
./docker-management.sh migrate dev   # Run dev migrations
./docker-management.sh migrate prod  # Run prod migrations

# Shell access
./docker-management.sh shell dev     # App container shell
./docker-management.sh db-shell dev  # Database shell

# Backup and restore
./docker-management.sh backup dev    # Backup development
./docker-management.sh backup prod   # Backup production

# Reset environment (WARNING: Data loss)
./docker-management.sh reset dev     # Reset development
./docker-management.sh reset prod    # Reset production

# Cleanup
./docker-management.sh cleanup       # Clean unused Docker resources
```

### Manual Docker Commands
```bash
# Development
docker-compose -f docker-compose.dev.yml up -d
docker-compose -f docker-compose.dev.yml logs -f
docker-compose -f docker-compose.dev.yml down

# Production
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml logs -f
docker-compose -f docker-compose.prod.yml down
```

## Test Accounts

Both environments come with pre-configured test accounts:

### Admin Account
- **Email**: admin@dtvisuals.com
- **Password**: admin123
- **Permissions**: Full system access

### Staff Account
- **Email**: staff@dtvisuals.com
- **Password**: staff123
- **Permissions**: Media management, client viewing

### Client Account
- **Email**: client@example.com
- **Password**: client123
- **Permissions**: View assigned media only

## Features Available

### Development Environment
- ✅ Hot reload for instant code changes
- ✅ Debug logging and detailed error messages
- ✅ Timeline functionality for video annotations
- ✅ Media upload and management
- ✅ Role-based access control (RBAC)
- ✅ Client feedback system
- ✅ Website customization tools

### Production Environment
- ✅ Optimized build for performance
- ✅ Health monitoring and auto-restart
- ✅ Timeline functionality for video annotations
- ✅ Media upload and management
- ✅ Role-based access control (RBAC)
- ✅ Client feedback system
- ✅ Website customization tools
- ✅ Production-grade security settings

## Database Management

### Schema Migrations
```bash
# Development
docker-compose -f docker-compose.dev.yml exec app-dev npm run db:push

# Production
docker-compose -f docker-compose.prod.yml exec app-prod npm run db:push
```

### Database Access
```bash
# Development database
docker-compose -f docker-compose.dev.yml exec postgres-dev psql -U postgres -d dt_visuals_dev

# Production database
docker-compose -f docker-compose.prod.yml exec postgres-prod psql -U postgres -d dt_visuals_prod
```

### Backup and Restore
```bash
# Backup development
./docker-management.sh backup dev

# Backup production
./docker-management.sh backup prod

# Backups are stored in ./backups/[env]_[timestamp]/
# - database.sql: Database dump
# - uploads.tar.gz: Uploaded files
```

## Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check what's using the ports
netstat -ano | findstr :3000
netstat -ano | findstr :5000
netstat -ano | findstr :5432
netstat -ano | findstr :5433

# Stop conflicting processes or change ports in docker-compose files
```

#### Container Won't Start
```bash
# Check logs
./docker-management.sh logs dev
./docker-management.sh logs prod

# Check container status
./docker-management.sh status

# Rebuild containers
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.prod.yml build --no-cache
```

#### Database Connection Issues
```bash
# Check database logs
docker-compose -f docker-compose.dev.yml logs postgres-dev
docker-compose -f docker-compose.prod.yml logs postgres-prod

# Test database connection
docker-compose -f docker-compose.dev.yml exec app-dev npm run db:push
```

#### Timeline Features Not Working
1. Ensure `ENABLE_TIMELINE=true` in environment file
2. Check database migrations have run
3. Verify API endpoints are accessible
4. Check browser console for JavaScript errors

### Log Locations
- **Application Logs**: `docker-compose logs [service-name]`
- **Database Logs**: `docker-compose logs postgres-[env]`
- **System Logs**: Check Docker Desktop logs

### Performance Optimization

#### For Development
- Increase Docker Desktop memory allocation to 6GB+
- Use WSL2 backend for better performance
- Mount source code as volume for hot reload

#### For Production
- Set Docker Desktop to 8GB+ memory
- Use multi-stage builds (already implemented)
- Enable Docker Desktop's "Use Docker Compose V2"

## Security Considerations

### Production Security Checklist
- [ ] Change `PROD_SESSION_SECRET` to a secure random string
- [ ] Change `PROD_POSTGRES_PASSWORD` to a strong password
- [ ] Ensure ports are not exposed to public networks
- [ ] Regularly update container images
- [ ] Monitor logs for suspicious activity
- [ ] Backup data regularly
- [ ] Use Docker secrets for sensitive data in production

### Network Security
- Containers communicate through isolated Docker networks
- Database ports are only exposed to host machine
- Application ports can be restricted using firewall rules

## Monitoring and Maintenance

### Health Checks
- Production containers include built-in health checks
- Failed health checks trigger automatic restarts
- Monitor health status: `docker-compose ps`

### Updates
```bash
# Update application code
git pull
./docker-management.sh restart dev
./docker-management.sh restart prod

# Update container images
docker-compose pull
./docker-management.sh restart dev
./docker-management.sh restart prod
```

### Maintenance Schedule
- **Daily**: Check logs and container status
- **Weekly**: Update container images and restart services
- **Monthly**: Clean unused Docker resources
- **Quarterly**: Full backup and security review

## Support

For issues specific to:
- **Docker**: Check Docker Desktop logs and documentation
- **Application**: Check application logs and source code
- **Database**: Check PostgreSQL container logs
- **Windows**: Ensure WSL2 is properly configured

## File Structure
```
project/
├── docker-compose.dual.yml     # Dual environment (prod + dev)
├── docker-compose.letsencrypt.yml # Extended with SSL automation
├── Dockerfile.dev              # Development container
├── Dockerfile.prod             # Production container
├── .env.dev                    # Development environment variables
├── .env.prod                   # Production environment variables
├── deploy-dev.sh               # Development deployment script
├── deploy-prod.sh              # Production deployment script
├── deploy-with-letsencrypt.sh  # SSL-enabled deployment script
├── docker-management.sh        # Management utility script
└── backups/                    # Backup storage directory

# Note: Database initialization now handled programmatically by server/init-database.ts
# This provides better environment detection, migration support, and RBAC setup
```

This setup provides a robust, scalable Docker deployment solution for the dt.visuals platform with clear separation between development and production environments while maintaining data persistence and easy management.