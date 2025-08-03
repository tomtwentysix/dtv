# Docker Troubleshooting Guide - dt.visuals

## Common Issues and Solutions

### 1. Permission Denied Error (EACCES)

**Error:** `EACCES: permission denied, mkdir '/app/node_modules/.vite/deps_temp_*'`

**Cause:** Docker container doesn't have proper permissions for Vite cache directory.

**Solution:**
```powershell
# Stop containers and clear problematic volumes
docker-compose -f docker-compose.dev.yml down
docker volume rm dt-visuals-vite-cache-dev
docker volume rm dt-visuals-node-modules-dev

# Rebuild and restart
.\deploy-dev-fixed.ps1
```

**Prevention:** The fixed deployment scripts now automatically clear these volumes.

### 2. Port Already in Use

**Error:** `bind: address already in use`

**Solutions:**
```powershell
# Check what's using the port
netstat -ano | findstr :3000  # Development
netstat -ano | findstr :5000  # Production

# Kill the process (replace PID with actual process ID)
taskkill /PID [PID_NUMBER] /F

# Or stop all Docker containers
docker stop $(docker ps -q)
```

### 3. Database Connection Failed

**Error:** `connection to server failed`

**Solutions:**
```powershell
# Check if PostgreSQL container is running
docker ps | findstr postgres

# Check PostgreSQL logs
.\docker-management-fixed.ps1 logs dev

# Reset database (WARNING: Data loss)
docker-compose -f docker-compose.dev.yml down -v
.\deploy-dev-fixed.ps1
```

### 4. Container Build Failed

**Error:** Various build errors during `docker-compose build`

**Solutions:**
```powershell
# Clean build with no cache
docker-compose -f docker-compose.dev.yml build --no-cache

# Clean Docker system (removes all unused resources)
docker system prune -a

# If still failing, rebuild everything
.\docker-management-fixed.ps1 reset dev -Force
```

### 5. Volume Mount Issues

**Error:** Files not updating or permission errors

**Solutions:**
```powershell
# Stop containers and remove volumes
docker-compose -f docker-compose.dev.yml down -v

# Clear all project volumes
docker volume rm dt-visuals-uploads-dev
docker volume rm dt-visuals-postgres-dev-data
docker volume rm dt-visuals-node-modules-dev
docker volume rm dt-visuals-vite-cache-dev

# Restart fresh
.\deploy-dev-fixed.ps1
```

### 6. Health Check Failures

**Error:** Container shows as unhealthy

**Solutions:**
```powershell
# Check application logs
docker-compose -f docker-compose.dev.yml logs app-dev

# Test health endpoint manually
curl http://localhost:3000/api/health

# Check if database is ready
docker-compose -f docker-compose.dev.yml logs postgres-dev
```

### 7. Memory Issues

**Error:** Container killed or out of memory errors

**Solutions:**
1. Increase Docker Desktop memory allocation:
   - Open Docker Desktop → Settings → Resources → Advanced
   - Increase memory to at least 4GB

2. Clean up unused resources:
```powershell
docker system prune -a
docker volume prune
```

### 8. Windows-Specific Issues

#### WSL2 Integration
- Ensure WSL2 is enabled in Docker Desktop settings
- Make sure "Use Docker Compose V2" is enabled

#### File Permissions
```powershell
# If you get file permission errors
icacls . /grant Everyone:F /T
```

#### PowerShell Execution Policy
```powershell
# If PowerShell scripts won't run
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Environment-Specific Debugging

### Development Environment
```powershell
# View all development logs
docker-compose -f docker-compose.dev.yml logs -f

# Access development container shell
docker-compose -f docker-compose.dev.yml exec app-dev sh

# Access development database
docker-compose -f docker-compose.dev.yml exec postgres-dev psql -U postgres -d dt_visuals_dev
```

### Production Environment
```powershell
# View all production logs  
docker-compose -f docker-compose.prod.yml logs -f

# Access production container shell
docker-compose -f docker-compose.prod.yml exec app-prod sh

# Access production database
docker-compose -f docker-compose.prod.yml exec postgres-prod psql -U postgres -d dt_visuals_prod
```

## Performance Optimization

### Container Performance
```powershell
# Monitor container resource usage
docker stats

# Check container sizes
docker images

# Clean up large unused images
docker image prune -a
```

### Database Performance
```sql
-- Connect to database and run these queries
-- Check database connections
SELECT * FROM pg_stat_activity;

-- Check database size
SELECT pg_size_pretty(pg_database_size('dt_visuals_dev'));

-- Check table sizes
SELECT schemaname,tablename,pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Reset Everything (Nuclear Option)

If nothing else works, completely reset:

```powershell
# Stop all containers
docker stop $(docker ps -q)

# Remove all containers
docker rm $(docker ps -aq)

# Remove all volumes
docker volume prune -f

# Remove all images
docker image prune -a -f

# Clean system
docker system prune -a -f

# Restart Docker Desktop
# Then run deployment script
.\deploy-dev-fixed.ps1
```

## Getting Help

If you're still having issues:

1. **Check Logs**: Always start with container logs
2. **Test Components**: Test database, application, and health endpoints separately  
3. **Environment**: Verify your `.env.dev` or `.env.prod` files
4. **Resources**: Ensure Docker Desktop has enough memory and disk space
5. **Documentation**: Review `QUICK_START_WINDOWS.md` for setup requirements

## Useful Commands Reference

```powershell
# Container management
docker ps                                    # List running containers
docker ps -a                                # List all containers
docker logs <container_name>                # View container logs
docker exec -it <container_name> sh         # Enter container shell

# Volume management  
docker volume ls                             # List volumes
docker volume inspect <volume_name>         # Inspect volume
docker volume rm <volume_name>              # Remove volume

# Network management
docker network ls                           # List networks
docker network inspect <network_name>       # Inspect network

# System cleanup
docker system df                            # Check disk usage
docker system prune                         # Clean up unused resources
```