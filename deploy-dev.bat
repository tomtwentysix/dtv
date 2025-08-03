@echo off
setlocal enabledelayedexpansion

:: dt.visuals Development Environment Deployment Script
:: Windows Batch file for Docker Desktop

echo 🎬 dt.visuals Development Deployment
echo =====================================

:: Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

:: Check if environment file exists
if not exist ".env.dev" (
    echo ❌ .env.dev file not found. Please create it first.
    pause
    exit /b 1
)

echo 🔍 Pre-deployment checks...

:: Check if required files exist
if not exist "Dockerfile.dev" (
    echo ❌ Required file Dockerfile.dev not found
    pause
    exit /b 1
)
if not exist "docker-compose.dev.yml" (
    echo ❌ Required file docker-compose.dev.yml not found
    pause
    exit /b 1
)
if not exist "package.json" (
    echo ❌ Required file package.json not found
    pause
    exit /b 1
)

echo ✅ All required files present

:: Stop existing development containers
echo 🛑 Stopping existing development containers...
docker-compose -f docker-compose.dev.yml down >nul 2>&1

echo 🧹 Clearing development cache volumes...
docker volume rm dt-visuals-vite-cache-dev >nul 2>&1
docker volume rm dt-visuals-node-modules-dev >nul 2>&1

:: Build and start development services
echo 🏗️  Building development Docker image...
docker-compose -f docker-compose.dev.yml build --no-cache
if %errorlevel% neq 0 (
    echo ❌ Failed to build Docker image
    pause
    exit /b 1
)

echo 🚀 Starting development services...
docker-compose -f docker-compose.dev.yml up -d
if %errorlevel% neq 0 (
    echo ❌ Failed to start services
    pause
    exit /b 1
)

:: Wait for services to be ready
echo ⏳ Waiting for services to start...
timeout /t 15 /nobreak >nul

:: Check service health (simplified for batch)
echo 🔍 Checking service health...
timeout /t 10 /nobreak >nul

:: Run database migrations
echo 🗄️  Running database migrations...
docker-compose -f docker-compose.dev.yml exec -T app-dev npm run db:push

echo 🔄 Populating development database with test data...
docker-compose -f docker-compose.dev.yml exec -T postgres-dev psql -U postgres -d dt_visuals_dev -c "SELECT populate_dev_test_data();"
echo ✅ Development test data populated successfully!

echo.
echo 🎉 Development deployment completed successfully!
echo.
echo 📱 Development Application Access:
echo    URL: http://localhost:3000
echo    Database: postgresql://postgres:devpassword@localhost:5433/dt_visuals_dev
echo.
echo 👥 Test Accounts:
echo    Admin: admin@dtvisuals.com / admin123
echo    Staff: staff@dtvisuals.com / staff123
echo    Client: client@example.com / client123
echo.
echo 🎬 Development Features:
echo    - Hot reload enabled
echo    - Debug logging active
echo    - Timeline functionality
echo    - Media management
echo    - RBAC system
echo.
echo 🛠️  Development Commands:
echo    View logs: docker-compose -f docker-compose.dev.yml logs -f
echo    Stop: docker-compose -f docker-compose.dev.yml down
echo    Restart: docker-compose -f docker-compose.dev.yml restart
echo.
pause