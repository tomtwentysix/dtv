#!/bin/bash

# DT Visuals Environment Configuration Helper
# This script helps set up .env files with the auto-generated database password

set -e

echo "⚙️  DT Visuals Environment Configuration"
echo "========================================"

# Check if we're in the right directory
if [[ ! -f "package.json" ]] || [[ ! -f ".env.prod.template" ]]; then
    echo "❌ Please run this script from the application directory (/var/www/dtvisuals/app)"
    exit 1
fi

# Check for database password
if [[ -f "/tmp/dtvisuals_db_password.txt" ]]; then
    DB_PASSWORD=$(cat /tmp/dtvisuals_db_password.txt)
    echo "✅ Found database password: ${DB_PASSWORD:0:8}..."
else
    echo "⚠️  Database password file not found. Using placeholder."
    DB_PASSWORD="CHANGE_PASSWORD"
fi

# Generate session secrets
PROD_SESSION_SECRET=$(openssl rand -base64 48)
DEV_SESSION_SECRET=$(openssl rand -base64 48)

echo "🔑 Generated secure session secrets"

# Prompt for domain
read -p "Enter your production domain (e.g., dtvisuals.com): " PROD_DOMAIN
read -p "Enter your development domain (e.g., dev.dtvisuals.com): " DEV_DOMAIN

# Create production environment file
echo ""
echo "📝 Creating .env.prod..."
if [[ -f ".env.prod" ]]; then
    cp .env.prod .env.prod.backup.$(date +%s)
    echo "   Backed up existing .env.prod"
fi

cat > .env.prod << EOF
# Production Environment Variables
NODE_ENV=production
PORT=5001

# Database Configuration
DATABASE_URL=postgresql://dtvisuals:${DB_PASSWORD}@localhost:5432/dtvisuals_prod

# Session Configuration
SESSION_SECRET=${PROD_SESSION_SECRET}

# Application Configuration
DOMAIN=${PROD_DOMAIN}
APP_NAME=DT-Visuals-Production

# File Upload Configuration
UPLOADS_DIR=/var/www/dtvisuals/uploads/prod
MAX_FILE_SIZE=50000000

# Security Configuration
TRUSTED_PROXIES=127.0.0.1,::1

# Optional: External Services
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
EOF

# Create development environment file
echo "📝 Creating .env.dev..."
if [[ -f ".env.dev" ]]; then
    cp .env.dev .env.dev.backup.$(date +%s)
    echo "   Backed up existing .env.dev"
fi

cat > .env.dev << EOF
# Development Environment Variables
NODE_ENV=development
PORT=5002

# Database Configuration
DATABASE_URL=postgresql://dtvisuals:${DB_PASSWORD}@localhost:5432/dtvisuals_dev

# Session Configuration
SESSION_SECRET=${DEV_SESSION_SECRET}

# Application Configuration
DOMAIN=${DEV_DOMAIN}
APP_NAME=DT-Visuals-Development

# File Upload Configuration
UPLOADS_DIR=/var/www/dtvisuals/uploads/dev
MAX_FILE_SIZE=50000000

# Security Configuration
TRUSTED_PROXIES=127.0.0.1,::1

# Optional: External Services
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
EOF

# Set proper ownership
chown dtvisuals:www-data .env.prod .env.dev
chmod 600 .env.prod .env.dev

echo ""
echo "✅ Environment files created successfully!"
echo ""
echo "📋 Configuration Summary:"
echo "   Production domain: ${PROD_DOMAIN}"
echo "   Development domain: ${DEV_DOMAIN}"
echo "   Database password: ${DB_PASSWORD:0:8}..."
echo "   Production uploads: /var/www/dtvisuals/uploads/prod"
echo "   Development uploads: /var/www/dtvisuals/uploads/dev"
echo ""
echo "🔒 Security Notes:"
echo "   - Environment files are owned by dtvisuals:www-data with 600 permissions"
echo "   - Unique session secrets generated for each environment"
echo "   - Database password automatically configured"
echo ""
echo "🚀 Next Steps:"
echo "   1. Review and customize the created .env files if needed"
echo "   2. Configure optional services (SMTP) if required"
echo "   3. Run deployment: sudo ./deploy.sh prod main"
echo "   4. Set up SSL certificates: sudo ./ssl-setup.sh ${PROD_DOMAIN},${DEV_DOMAIN} admin@${PROD_DOMAIN}"