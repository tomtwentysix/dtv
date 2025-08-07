#!/bin/bash

# Traefik Deployment Script for DT Visuals
# This script deploys both production and development environments with Traefik and Let's Encrypt

set -e

echo "🚀 DT Visuals Traefik Deployment Script"
echo "======================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Check if Docker is installed with multiple detection methods
print_status "Checking Docker installation..."
DOCKER_FOUND=false

# Method 1: command -v
if command -v docker &> /dev/null; then
    DOCKER_FOUND=true
# Method 2: which command
elif which docker &> /dev/null; then
    DOCKER_FOUND=true
# Method 3: direct path check
elif [ -x "/usr/bin/docker" ] || [ -x "/usr/local/bin/docker" ] || [ -x "/snap/bin/docker" ]; then
    DOCKER_FOUND=true
# Method 4: try to run docker version
elif docker --version &> /dev/null; then
    DOCKER_FOUND=true
fi

if [ "$DOCKER_FOUND" = false ]; then
    print_error "Docker is not installed or not accessible. Please install Docker first."
    print_error "Debug info:"
    echo "  PATH: $PATH"
    echo "  User: $(whoami)"
    echo "  Shell: $SHELL"
    exit 1
else
    print_success "Docker found: $(docker --version 2>/dev/null || echo 'Docker is available')"
fi

# Check if Docker Compose is installed with multiple detection methods
print_status "Checking Docker Compose installation..."
COMPOSE_FOUND=false

# Method 1: docker-compose command
if command -v docker-compose &> /dev/null; then
    COMPOSE_FOUND=true
    COMPOSE_CMD="docker-compose"
# Method 2: docker compose plugin
elif docker compose version &> /dev/null; then
    COMPOSE_FOUND=true
    COMPOSE_CMD="docker compose"
# Method 3: which docker-compose
elif which docker-compose &> /dev/null; then
    COMPOSE_FOUND=true
    COMPOSE_CMD="docker-compose"
fi

if [ "$COMPOSE_FOUND" = false ]; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    print_error "You can install it with: sudo apt-get install docker-compose-plugin"
    exit 1
else
    if [ "$COMPOSE_CMD" = "docker-compose" ]; then
        print_success "Docker Compose found: $(docker-compose --version 2>/dev/null || echo 'Docker Compose is available')"
    else
        print_success "Docker Compose plugin found: $(docker compose version 2>/dev/null || echo 'Docker Compose plugin is available')"
    fi
fi

print_status "Checking environment configuration..."

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from template..."
    cp .env.traefik .env
    print_warning "Please edit .env file with your configuration before proceeding"
    print_warning "Pay special attention to:"
    echo "  - ACME_EMAIL (your email for Let's Encrypt)"
    echo "  - Database passwords"
    echo "  - Session secrets"
    echo ""
    read -p "Have you configured the .env file? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Please configure .env file first"
        exit 1
    fi
fi

print_status "Creating required directories..."

# Create required directories
mkdir -p traefik-data
mkdir -p docker/postgres

# Set proper permissions for Traefik data directory
sudo chown -R $USER:$USER traefik-data
chmod 600 traefik-data

print_status "Creating external network..."

# Create external network for Traefik
docker network create traefik 2>/dev/null || print_warning "Network 'traefik' already exists"

print_status "Stopping existing containers..."

# Stop existing containers to avoid conflicts
docker-compose -f docker-compose.yml down 2>/dev/null || true
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

print_status "Building application images..."

# Build the application
$COMPOSE_CMD -f docker-compose.traefik.yml build

print_status "Starting Traefik and services..."

# Start services
$COMPOSE_CMD -f docker-compose.traefik.yml up -d

print_status "Waiting for services to start..."

# Wait for services to be ready
sleep 30

# Check if services are running
if $COMPOSE_CMD -f docker-compose.traefik.yml ps | grep -q "Up"; then
    print_success "Services started successfully!"
    echo ""
    print_status "Service Status:"
    $COMPOSE_CMD -f docker-compose.traefik.yml ps
    echo ""
    print_success "Deployment complete!"
    echo ""
    print_status "Your sites should be available at:"
    echo "  🌍 Production: https://dtvisuals.com"
    echo "  🔧 Development: https://dev.dtvisuals.com"
    echo "  📊 Traefik Dashboard: https://traefik.dtvisuals.com"
    echo ""
    print_warning "Note: SSL certificates may take a few minutes to be issued by Let's Encrypt"
    print_warning "Check logs with: $COMPOSE_CMD -f docker-compose.traefik.yml logs traefik"
else
    print_error "Some services failed to start. Check logs with:"
    echo "$COMPOSE_CMD -f docker-compose.traefik.yml logs"
    exit 1
fi