# dt.visuals Docker Management Script
# PowerShell script for Windows Docker Desktop
# Provides easy management commands for both development and production environments

param(
    [Parameter(Mandatory=$true, Position=0)]
    [ValidateSet("start", "stop", "restart", "logs", "status", "cleanup", "backup", "shell", "db-shell", "migrate", "reset", "help")]
    [string]$Command,
    
    [Parameter(Position=1)]
    [ValidateSet("dev", "prod")]
    [string]$Environment = "",
    
    [switch]$Force
)

function Show-Help {
    Write-Host "dt.visuals Docker Management" -ForegroundColor Cyan
    Write-Host "==============================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\docker-management-fixed.ps1 [COMMAND] [ENVIRONMENT]" -ForegroundColor White
    Write-Host ""
    Write-Host "COMMANDS:" -ForegroundColor Yellow
    Write-Host "  start     Start the specified environment" -ForegroundColor White
    Write-Host "  stop      Stop the specified environment" -ForegroundColor White
    Write-Host "  restart   Restart the specified environment" -ForegroundColor White
    Write-Host "  logs      Show logs for the specified environment" -ForegroundColor White
    Write-Host "  status    Show status of containers" -ForegroundColor White
    Write-Host "  cleanup   Remove stopped containers and unused images" -ForegroundColor White
    Write-Host "  backup    Backup database and uploads" -ForegroundColor White
    Write-Host "  shell     Open shell in app container" -ForegroundColor White
    Write-Host "  db-shell  Open PostgreSQL shell" -ForegroundColor White
    Write-Host "  migrate   Run database migrations" -ForegroundColor White
    Write-Host "  reset     Reset environment (removes all data)" -ForegroundColor White
    Write-Host ""
    Write-Host "ENVIRONMENTS:" -ForegroundColor Yellow
    Write-Host "  dev       Development environment (port 3000)" -ForegroundColor White
    Write-Host "  prod      Production environment (port 5000)" -ForegroundColor White
    Write-Host ""
    Write-Host "EXAMPLES:" -ForegroundColor Yellow
    Write-Host "  .\docker-management-fixed.ps1 start dev" -ForegroundColor White
    Write-Host "  .\docker-management-fixed.ps1 logs prod" -ForegroundColor White
    Write-Host "  .\docker-management-fixed.ps1 backup dev" -ForegroundColor White
    Write-Host "  .\docker-management-fixed.ps1 shell prod" -ForegroundColor White
}

function Test-Environment {
    param([string]$env)
    if ($env -ne "dev" -and $env -ne "prod" -and $env -ne "") {
        Write-Host "Invalid environment. Use 'dev' or 'prod'" -ForegroundColor Red
        exit 1
    }
}

function Get-ComposeFile {
    param([string]$env)
    if ($env -eq "dev") {
        return "docker-compose.dev.yml"
    } else {
        return "docker-compose.prod.yml"
    }
}

function Get-AppService {
    param([string]$env)
    if ($env -eq "dev") {
        return "app-dev"
    } else {
        return "app-prod"
    }
}

function Get-DbService {
    param([string]$env)
    if ($env -eq "dev") {
        return "postgres-dev"
    } else {
        return "postgres-prod"
    }
}

function Start-Environment {
    param([string]$env)
    $composeFile = Get-ComposeFile $env
    
    Write-Host "Starting $env environment..." -ForegroundColor Yellow
    try {
        docker-compose -f $composeFile up -d
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to start environment"
        }
        
        if ($env -eq "dev") {
            Write-Host "$env environment started on http://localhost:3000" -ForegroundColor Green
        } else {
            Write-Host "$env environment started on http://localhost:5000" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "Failed to start $env environment" -ForegroundColor Red
        exit 1
    }
}

function Stop-Environment {
    param([string]$env)
    $composeFile = Get-ComposeFile $env
    
    Write-Host "Stopping $env environment..." -ForegroundColor Yellow
    try {
        docker-compose -f $composeFile down
        Write-Host "$env environment stopped" -ForegroundColor Green
    }
    catch {
        Write-Host "Failed to stop $env environment" -ForegroundColor Red
        exit 1
    }
}

function Restart-Environment {
    param([string]$env)
    $composeFile = Get-ComposeFile $env
    
    Write-Host "Restarting $env environment..." -ForegroundColor Yellow
    try {
        docker-compose -f $composeFile restart
        Write-Host "$env environment restarted" -ForegroundColor Green
    }
    catch {
        Write-Host "Failed to restart $env environment" -ForegroundColor Red
        exit 1
    }
}

function Show-Logs {
    param([string]$env)
    $composeFile = Get-ComposeFile $env
    
    Write-Host "Showing logs for $env environment..." -ForegroundColor Yellow
    docker-compose -f $composeFile logs -f
}

function Show-Status {
    Write-Host "Container Status:" -ForegroundColor Yellow
    Write-Host ""
    docker ps -a --filter "name=dt-visuals"
}

function Invoke-Cleanup {
    Write-Host "Cleaning up Docker resources..." -ForegroundColor Yellow
    
    # Remove stopped containers
    docker container prune -f
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes (be careful with this)
    Write-Host "Remove unused volumes? This will delete data not associated with running containers." -ForegroundColor Yellow
    $confirm = Read-Host "Continue? (y/N)"
    if ($confirm -eq 'y' -or $confirm -eq 'Y') {
        docker volume prune -f
    }
    
    Write-Host "Cleanup completed" -ForegroundColor Green
}

function Backup-Environment {
    param([string]$env)
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupDir = ".\backups\${env}_${timestamp}"
    
    Write-Host "Backing up $env environment..." -ForegroundColor Yellow
    
    # Create backup directory
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    
    # Backup database
    $dbService = Get-DbService $env
    $composeFile = Get-ComposeFile $env
    
    try {
        if ($env -eq "dev") {
            docker-compose -f $composeFile exec -T $dbService pg_dump -U postgres dt_visuals_dev > "$backupDir\database.sql"
        } else {
            docker-compose -f $composeFile exec -T $dbService pg_dump -U postgres dt_visuals_prod > "$backupDir\database.sql"
        }
        
        # Backup uploads
        $volumeName = "dt-visuals-uploads-${env}"
        docker run --rm -v "${volumeName}:/data" -v "${PWD}\${backupDir}:/backup" alpine tar czf /backup/uploads.tar.gz -C /data .
        
        Write-Host "Backup completed: $backupDir" -ForegroundColor Green
    }
    catch {
        Write-Host "Backup failed" -ForegroundColor Red
        exit 1
    }
}

function Open-Shell {
    param([string]$env)
    $appService = Get-AppService $env
    $composeFile = Get-ComposeFile $env
    
    Write-Host "Opening shell in $env app container..." -ForegroundColor Yellow
    docker-compose -f $composeFile exec $appService sh
}

function Open-DbShell {
    param([string]$env)
    $dbService = Get-DbService $env
    $composeFile = Get-ComposeFile $env
    
    Write-Host "Opening PostgreSQL shell for $env..." -ForegroundColor Yellow
    if ($env -eq "dev") {
        docker-compose -f $composeFile exec $dbService psql -U postgres -d dt_visuals_dev
    } else {
        docker-compose -f $composeFile exec $dbService psql -U postgres -d dt_visuals_prod
    }
}

function Invoke-Migrations {
    param([string]$env)
    $appService = Get-AppService $env
    $composeFile = Get-ComposeFile $env
    
    Write-Host "Running database migrations for $env..." -ForegroundColor Yellow
    try {
        docker-compose -f $composeFile exec $appService npm run db:push
        Write-Host "Migrations completed" -ForegroundColor Green
    }
    catch {
        Write-Host "Migrations failed" -ForegroundColor Red
        exit 1
    }
}

function Reset-Environment {
    param([string]$env)
    $composeFile = Get-ComposeFile $env
    
    if (-not $Force) {
        Write-Host "WARNING: This will completely reset the $env environment!" -ForegroundColor Red
        Write-Host "   - All containers will be removed" -ForegroundColor Yellow
        Write-Host "   - All data will be lost" -ForegroundColor Yellow
        Write-Host "   - Volumes will be deleted" -ForegroundColor Yellow
        Write-Host ""
        $confirm = Read-Host "Are you sure you want to continue? (y/N)"
        if ($confirm -ne 'y' -and $confirm -ne 'Y') {
            Write-Host "Reset cancelled" -ForegroundColor Red
            exit 1
        }
    }
    
    Write-Host "Resetting $env environment..." -ForegroundColor Yellow
    try {
        docker-compose -f $composeFile down -v --remove-orphans
        docker-compose -f $composeFile build --no-cache
        docker-compose -f $composeFile up -d
        
        Write-Host "$env environment reset completed" -ForegroundColor Green
    }
    catch {
        Write-Host "Reset failed" -ForegroundColor Red
        exit 1
    }
}

# Main script logic
if ($Command -eq "help") {
    Show-Help
    exit 0
}

# Commands that don't require environment
if ($Command -eq "status") {
    Show-Status
    exit 0
}

if ($Command -eq "cleanup") {
    Invoke-Cleanup
    exit 0
}

# Validate environment for commands that need it
if ($Environment -eq "") {
    Write-Host "Environment required for command '$Command'. Use 'dev' or 'prod'" -ForegroundColor Red
    exit 1
}

Test-Environment $Environment

# Execute the requested command
switch ($Command) {
    "start" { Start-Environment $Environment }
    "stop" { Stop-Environment $Environment }
    "restart" { Restart-Environment $Environment }
    "logs" { Show-Logs $Environment }
    "backup" { Backup-Environment $Environment }
    "shell" { Open-Shell $Environment }
    "db-shell" { Open-DbShell $Environment }
    "migrate" { Invoke-Migrations $Environment }
    "reset" { Reset-Environment $Environment }
    default {
        Write-Host "Unknown command: $Command" -ForegroundColor Red
        Write-Host ""
        Show-Help
        exit 1
    }
}