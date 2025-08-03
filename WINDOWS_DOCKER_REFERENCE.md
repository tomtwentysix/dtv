# Windows Docker Reference Card

## Quick Commands

### PowerShell Deployment
```powershell
# Development (port 3000)
.\deploy-dev.ps1

# Production (port 5000) 
.\deploy-prod.ps1

# Management
.\docker-management.ps1 status
.\docker-management.ps1 logs dev
.\docker-management.ps1 stop dev
```

### Command Prompt
```cmd
# Development only
deploy-dev.bat
```

## Environment Setup

### Development (.env.dev)
```env
NODE_ENV=development
DEV_POSTGRES_PASSWORD=devpassword
DATABASE_URL=postgresql://postgres:devpassword@postgres-dev:5432/dt_visuals_dev
```

### Production (.env.prod) - EDIT THESE!
```env
NODE_ENV=production
PROD_POSTGRES_PASSWORD=CHANGE_THIS_PASSWORD
PROD_SESSION_SECRET=CHANGE_THIS_TO_SECURE_RANDOM_STRING
DATABASE_URL=postgresql://postgres:CHANGE_THIS_PASSWORD@postgres-prod:5432/dt_visuals_prod
```

## Access URLs

- **Development**: http://localhost:3000
- **Production**: http://localhost:5000
- **Dev Database**: localhost:5433
- **Prod Database**: localhost:5432

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@dtvisuals.com | admin123 | Admin |
| staff@dtvisuals.com | staff123 | Staff |
| client@example.com | client123 | Client |

## Docker Volumes

- **Dev Uploads**: `dt-visuals-uploads-dev`
- **Prod Uploads**: `dt-visuals-uploads-prod`
- **Dev Database**: `dt-visuals-postgres-dev-data`
- **Prod Database**: `dt-visuals-postgres-prod-data`

## Troubleshooting

```powershell
# Port conflicts
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# Container issues
.\docker-management.ps1 logs dev
docker-compose -f docker-compose.dev.yml build --no-cache

# Database issues
.\docker-management.ps1 migrate dev
.\docker-management.ps1 db-shell dev
```

## File Structure

```
├── deploy-dev.ps1              # PowerShell dev script
├── deploy-prod.ps1             # PowerShell prod script  
├── deploy-dev.bat              # Batch dev script
├── docker-management.ps1       # Management utility
├── docker-compose.dev.yml      # Dev environment
├── docker-compose.prod.yml     # Prod environment
├── Dockerfile.dev              # Dev container
├── Dockerfile.prod             # Prod container
├── .env.dev                    # Dev config
├── .env.prod                   # Prod config (EDIT!)
└── QUICK_START_WINDOWS.md      # Full guide
```