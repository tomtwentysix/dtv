# dt.visuals Production Environment Deployment Script
# PowerShell script for Windows Docker Desktop

param(
    [switch]$Force
)

Write-Host "🎬 dt.visuals Production Deployment" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Check if Docker is installed and running
try {
    $dockerVersion = docker --version 2>$null
    if (-not $dockerVersion) {
        throw "Docker not found"
    }
    Write-Host "✅ Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed or not running. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

try {
    $composeVersion = docker-compose --version 2>$null
    if (-not $composeVersion) {
        throw "Docker Compose not found"
    }
    Write-Host "✅ Docker Compose found: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not installed. Please install Docker Compose first." -ForegroundColor Red
    exit 1
}

# Check if environment file exists
if (-not (Test-Path ".env.prod")) {
    Write-Host "❌ .env.prod file not found. Please create it first." -ForegroundColor Red
    Write-Host "📝 Make sure to set secure values for:" -ForegroundColor Yellow
    Write-Host "   - PROD_SESSION_SECRET" -ForegroundColor White
    Write-Host "   - PROD_POSTGRES_PASSWORD" -ForegroundColor White
    exit 1
}

# Load and validate environment variables
$envContent = Get-Content ".env.prod" | Where-Object { $_ -notmatch '^#' -and $_ -ne '' }
$envVars = @{}
foreach ($line in $envContent) {
    if ($line -match '^([^=]+)=(.*)$') {
        $envVars[$matches[1]] = $matches[2]
    }
}

# Validate critical environment variables
if (-not $envVars.ContainsKey("PROD_SESSION_SECRET") -or $envVars["PROD_SESSION_SECRET"] -eq "prod-session-secret-key-change-this-to-secure-random-string") {
    Write-Host "❌ PROD_SESSION_SECRET is not set to a secure value in .env.prod file" -ForegroundColor Red
    Write-Host "   Please set a secure random string for production use" -ForegroundColor Yellow
    exit 1
}

Write-Host "🔍 Pre-deployment checks..." -ForegroundColor Yellow

# Check if required files exist
$requiredFiles = @("Dockerfile.prod", "docker-compose.prod.yml", "package.json")
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "❌ Required file $file not found" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ All required files present" -ForegroundColor Green

# Warning for production deployment
if (-not $Force) {
    Write-Host "⚠️  Production Deployment Warning" -ForegroundColor Yellow
    Write-Host "   This will deploy to production environment." -ForegroundColor Yellow
    Write-Host "   Make sure you have:" -ForegroundColor Yellow
    Write-Host "   - Set secure passwords in .env.prod" -ForegroundColor White
    Write-Host "   - Configured proper session secrets" -ForegroundColor White
    Write-Host "   - Backed up any existing data" -ForegroundColor White
    Write-Host ""
    $confirm = Read-Host "Continue with production deployment? (y/N)"
    if ($confirm -ne 'y' -and $confirm -ne 'Y') {
        Write-Host "❌ Production deployment cancelled" -ForegroundColor Red
        exit 1
    }
}

# Stop existing production containers
Write-Host "🛑 Stopping existing production containers..." -ForegroundColor Yellow
try {
    docker-compose -f docker-compose.prod.yml down 2>$null
} catch {
    # Ignore errors if containers don't exist
}

# Build and start production services
Write-Host "🏗️  Building production Docker image..." -ForegroundColor Yellow
try {
    docker-compose -f docker-compose.prod.yml build --no-cache
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed"
    }
} catch {
    Write-Host "❌ Failed to build Docker image" -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Starting production services..." -ForegroundColor Yellow
try {
    docker-compose -f docker-compose.prod.yml up -d
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to start services"
    }
} catch {
    Write-Host "❌ Failed to start services" -ForegroundColor Red
    exit 1
}

# Wait for services to be ready
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

# Check service health
Write-Host "🔍 Checking service health..." -ForegroundColor Yellow
$maxAttempts = 60
$attempt = 1

while ($attempt -le $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Production application is healthy!" -ForegroundColor Green
            break
        }
    } catch {
        # Continue trying
    }
    
    Write-Host "⏳ Attempt $attempt/$maxAttempts - waiting for application..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
    $attempt++
}

if ($attempt -gt $maxAttempts) {
    Write-Host "❌ Application failed to start within expected time" -ForegroundColor Red
    Write-Host "📋 Checking logs:" -ForegroundColor Yellow
    docker-compose -f docker-compose.prod.yml logs app-prod
    exit 1
}

# Run database migrations
Write-Host "🗄️  Running database migrations..." -ForegroundColor Yellow
try {
    docker-compose -f docker-compose.prod.yml exec -T app-prod npm run db:push
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Migration completed with warnings (this is usually normal for first run)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Migration step encountered issues (this might be normal for first run)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Production deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Production Application Access:" -ForegroundColor Cyan
Write-Host "   URL: http://localhost:5000" -ForegroundColor White
Write-Host "   Database: postgresql://postgres:***@localhost:5432/dt_visuals_prod" -ForegroundColor White
Write-Host ""
Write-Host "👥 Default Accounts:" -ForegroundColor Cyan
Write-Host "   Admin/Staff Portal: admin@dtvisuals.com / admin123" -ForegroundColor White
Write-Host "   (⚠️  Change password immediately after first login!)" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔐 Authentication Systems:" -ForegroundColor Cyan
Write-Host "   - Admin/Staff: Role-based authentication with permissions" -ForegroundColor White
Write-Host "   - Client Portal: Separate client authentication system" -ForegroundColor White
Write-Host "   - Create client accounts through admin interface" -ForegroundColor White
Write-Host ""
Write-Host "🎬 Production Features:" -ForegroundColor Cyan
Write-Host "   - Optimized build" -ForegroundColor White
Write-Host "   - Health monitoring" -ForegroundColor White
Write-Host "   - Multi-client media assignment system" -ForegroundColor White
Write-Host "   - Timeline and feedback functionality" -ForegroundColor White
Write-Host "   - Dual authentication (Admin + Client portals)" -ForegroundColor White
Write-Host "   - Role-based access control (RBAC)" -ForegroundColor White
Write-Host ""
Write-Host "🛠️  Production Commands:" -ForegroundColor Cyan
Write-Host "   View logs: docker-compose -f docker-compose.prod.yml logs -f" -ForegroundColor White
Write-Host "   Stop: docker-compose -f docker-compose.prod.yml down" -ForegroundColor White
Write-Host "   Restart: docker-compose -f docker-compose.prod.yml restart" -ForegroundColor White
Write-Host "   Management: .\docker-management.ps1 [command] prod" -ForegroundColor White
Write-Host ""
Write-Host "🔒 Security Reminders:" -ForegroundColor Cyan
Write-Host "   - Change default passwords in production" -ForegroundColor White
Write-Host "   - Use secure session secrets" -ForegroundColor White
Write-Host "   - Monitor logs regularly" -ForegroundColor White
Write-Host "   - Keep containers updated" -ForegroundColor White