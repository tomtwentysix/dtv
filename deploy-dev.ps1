# dt.visuals Development Environment Deployment Script
# PowerShell script for Windows Docker Desktop

param(
    [switch]$Force
)

Write-Host "🎬 dt.visuals Development Deployment" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

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
if (-not (Test-Path ".env.dev")) {
    Write-Host "❌ .env.dev file not found. Please create it first." -ForegroundColor Red
    exit 1
}

Write-Host "🔍 Pre-deployment checks..." -ForegroundColor Yellow

# Check if required files exist
$requiredFiles = @("Dockerfile.dev", "docker-compose.dev.yml", "package.json")
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "❌ Required file $file not found" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ All required files present" -ForegroundColor Green

# Stop existing development containers
Write-Host "🛑 Stopping existing development containers..." -ForegroundColor Yellow
try {
    docker-compose -f docker-compose.dev.yml down 2>$null
} catch {
    # Ignore errors if containers don't exist
}

# Build and start development services
Write-Host "🏗️  Building development Docker image..." -ForegroundColor Yellow
try {
    docker-compose -f docker-compose.dev.yml build --no-cache
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed"
    }
} catch {
    Write-Host "❌ Failed to build Docker image" -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Starting development services..." -ForegroundColor Yellow
try {
    docker-compose -f docker-compose.dev.yml up -d
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to start services"
    }
} catch {
    Write-Host "❌ Failed to start services" -ForegroundColor Red
    exit 1
}

# Wait for services to be ready
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check service health
Write-Host "🔍 Checking service health..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 1

while ($attempt -le $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Development application is healthy!" -ForegroundColor Green
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
    docker-compose -f docker-compose.dev.yml logs app-dev
    exit 1
}

# Run database migrations
Write-Host "🗄️  Running database migrations..." -ForegroundColor Yellow
try {
    docker-compose -f docker-compose.dev.yml exec -T app-dev npm run db:push
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Migration completed with warnings (this is usually normal for first run)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Migration step encountered issues (this might be normal for first run)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Development deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Development Application Access:" -ForegroundColor Cyan
Write-Host "   URL: http://localhost:3000" -ForegroundColor White
Write-Host "   Database: postgresql://postgres:devpassword@localhost:5433/dt_visuals_dev" -ForegroundColor White
Write-Host ""
Write-Host "👥 Test Accounts:" -ForegroundColor Cyan
Write-Host "   Admin: admin@dtvisuals.com / admin123" -ForegroundColor White
Write-Host "   Staff: staff@dtvisuals.com / staff123" -ForegroundColor White
Write-Host ""
Write-Host "👤 Client Portal Accounts:" -ForegroundColor Cyan
Write-Host "   Acme Corp: contact@acme.com / client123" -ForegroundColor White
Write-Host "   Creative Studios: hello@creativestudios.com / client123" -ForegroundColor White
Write-Host ""
Write-Host "🎬 Development Features:" -ForegroundColor Cyan
Write-Host "   - Hot reload enabled" -ForegroundColor White
Write-Host "   - Debug logging active" -ForegroundColor White
Write-Host "   - Timeline functionality" -ForegroundColor White
Write-Host "   - Media management" -ForegroundColor White
Write-Host "   - Dual authentication system (Admin/Staff + Client)" -ForegroundColor White
Write-Host "   - RBAC system with enhanced user management" -ForegroundColor White
Write-Host "   - Persistent database and uploads" -ForegroundColor White
Write-Host ""
Write-Host "🛠️  Development Commands:" -ForegroundColor Cyan
Write-Host "   View logs: docker-compose -f docker-compose.dev.yml logs -f" -ForegroundColor White
Write-Host "   Stop: docker-compose -f docker-compose.dev.yml down" -ForegroundColor White
Write-Host "   Restart: docker-compose -f docker-compose.dev.yml restart" -ForegroundColor White
Write-Host "   Management: .\docker-management.ps1 [command] dev" -ForegroundColor White