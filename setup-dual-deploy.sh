#!/bin/bash

# Dual Environment Setup Script
set -e

echo "🚀 Setting up dual environment deployment for DT Visuals"
echo "======================================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

# Create deployment directory
print_info "Creating deployment directory..."
sudo mkdir -p /opt/dt-visuals
sudo chown $USER:$USER /opt/dt-visuals
cd /opt/dt-visuals

# Copy configuration files
print_info "Setting up configuration files..."
cp /path/to/your/repo/docker-compose.dual.yml ./docker-compose.yml
cp /path/to/your/repo/nginx.conf ./nginx.conf
cp /path/to/your/repo/.env.dual ./.env

print_warning "Please edit .env file with your configuration:"
echo "  - GITHUB_REPOSITORY_OWNER"
echo "  - ACME_EMAIL"
echo "  - Database URLs"
echo "  - Session secrets"
echo ""

read -p "Have you configured the .env file? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Please configure .env file first, then run this script again"
    exit 1
fi

# Create SSL directory
print_info "Creating SSL directory..."
mkdir -p ssl

# Set up initial SSL certificates (self-signed for first run)
print_info "Setting up initial SSL certificates..."
openssl req -x509 -nodes -days 1 -newkey rsa:2048 \
    -keyout ssl/privkey.pem \
    -out ssl/fullchain.pem \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=dtvisuals.com"

# Start services
print_info "Starting services..."
docker-compose up -d nginx app-prod app-dev

# Wait for services
print_info "Waiting for services to start..."
sleep 30

# Get Let's Encrypt certificates
print_info "Obtaining Let's Encrypt certificates..."
docker-compose run --rm certbot

# Restart nginx with real certificates
print_info "Restarting nginx with SSL certificates..."
docker-compose restart nginx

print_success "Deployment complete!"
echo ""
print_info "Your sites are available at:"
echo "  🌍 Production: https://dtvisuals.com"
echo "  🔧 Development: https://dev.dtvisuals.com"
echo ""
print_info "To deploy updates, just push to GitHub - GitHub Actions will handle it!"