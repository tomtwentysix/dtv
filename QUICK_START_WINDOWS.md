# Quick Start Guide - Windows Docker Desktop

This guide gets you up and running with dt.visuals on Windows using Docker Desktop in under 5 minutes.

## Prerequisites ✅

1. **Docker Desktop for Windows** - [Download here](https://www.docker.com/products/docker-desktop/)
2. **PowerShell** or **Command Prompt** 
3. **4GB+ RAM** available for containers
4. **Important**: Both dev and prod environments use local PostgreSQL databases (not Neon)

## Quick Start 🚀

### 1. Choose Your Environment

#### Development Environment (Recommended for testing)
```powershell
# Using PowerShell (Recommended) - Fixed version
.\deploy-dev-fixed.ps1

# Using Command Prompt
deploy-dev.bat
```

**Access**: http://localhost:3000  
**Database**: Local PostgreSQL (port 5433) - dt_visuals_dev  
**Features**: Hot reload, debug logging  

#### Production Environment
```powershell
# Edit security settings first
notepad .env.prod

# Deploy production - Fixed version
.\deploy-prod-fixed.ps1
```

**Access**: http://localhost:5000  
**Database**: Local PostgreSQL (port 5432) - dt_visuals_prod  
**Features**: Optimized build, health monitoring  

### 2. Test Login

Both environments include test accounts:

| Role   | Email                    | Password  | Access Level |
|--------|--------------------------|-----------|--------------|
| Admin  | admin@dtvisuals.com      | admin123  | Full access  |
| Staff  | staff@dtvisuals.com      | staff123  | Limited      |
| Client | client@example.com       | client123 | View only    |

### 3. Key Features Available

✅ **Timeline Functionality** - Add notes to specific video timestamps  
✅ **Media Management** - Upload and organize videos/images  
✅ **Role-Based Access** - Different permissions for Admin/Staff/Client  
✅ **Client Feedback** - Rate and comment on media  
✅ **Website Customization** - Admin can customize backgrounds  

## Management Commands 🛠️

```powershell
# View container status
.\docker-management.ps1 status

# View logs
.\docker-management.ps1 logs dev
.\docker-management.ps1 logs prod

# Stop/Start environments
.\docker-management.ps1 stop dev
.\docker-management.ps1 start dev

# Backup data
.\docker-management.ps1 backup dev
.\docker-management.ps1 backup prod

# Open container shell
.\docker-management.ps1 shell dev

# Database shell
.\docker-management.ps1 db-shell dev

# Reset environment (WARNING: Data loss)
.\docker-management.ps1 reset dev
```

## Troubleshooting 🔧

### Port Already in Use
```powershell
# Check what's using the port
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# Kill the process using the port
taskkill /PID [PID_NUMBER] /F
```

### Container Won't Start
```powershell
# Check logs
.\docker-management.ps1 logs dev

# Rebuild container
docker-compose -f docker-compose.dev.yml build --no-cache
```

### Database Connection Issues
```powershell
# Run migrations manually
.\docker-management.ps1 migrate dev
```

## File Structure 📁

```
project/
├── deploy-dev.ps1              # PowerShell dev deployment
├── deploy-prod.ps1             # PowerShell prod deployment
├── deploy-dev.bat              # Batch file for cmd users
├── docker-management.ps1       # Management utility
├── docker-compose.dev.yml      # Development environment
├── docker-compose.prod.yml     # Production environment
├── .env.dev                    # Development settings
├── .env.prod                   # Production settings (edit before use!)
└── DOCKER_README.md            # Complete documentation
```

## Data Persistence 💾

Your uploads and database data are automatically saved in Docker volumes:

- **Development**: `dt-visuals-uploads-dev` & `dt-visuals-postgres-dev-data`
- **Production**: `dt-visuals-uploads-prod` & `dt-visuals-postgres-prod-data`

Data survives container restarts and rebuilds! 🎉

## Security Notes 🔒

### For Production Use:
1. **Change passwords** in `.env.prod`:
   - `PROD_SESSION_SECRET` - Set to secure random string
   - `PROD_POSTGRES_PASSWORD` - Set to strong password

2. **Firewall** - Only allow necessary ports through Windows Firewall

3. **Updates** - Regularly update Docker Desktop and rebuild containers

## Need Help? 📖

- **Full Documentation**: See `DOCKER_README.md`
- **Application Issues**: Check container logs
- **Docker Issues**: Check Docker Desktop logs
- **Windows Issues**: Ensure WSL2 is enabled in Docker Desktop

## Clean Up 🧹

To completely remove everything:

```powershell
# Stop all containers
.\docker-management.ps1 stop dev
.\docker-management.ps1 stop prod

# Remove everything (WARNING: Data loss!)
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.prod.yml down -v

# Clean up Docker resources
.\docker-management.ps1 cleanup
```

---

**That's it!** 🎬 Your dt.visuals platform is now running on Windows with Docker Desktop. The cinematic media production platform is ready for your creative workflow!