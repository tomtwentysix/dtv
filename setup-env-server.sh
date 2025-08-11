#!/bin/bash

# DT Visuals Server Environment Setup
# This script creates the correct environment files on the server

echo "=== Setting up DT Visuals Environment Files ==="

cd /var/www/dtvisuals/app

# Check if we have templates
if [[ ! -f ".env.prod.template" ]]; then
    echo "❌ .env.prod.template not found. Creating from current .env.prod..."
    if [[ -f ".env.prod" ]]; then
        cp .env.prod .env.prod.template
    else
        echo "❌ No environment template found!"
        exit 1
    fi
fi

# Create production environment file
echo "📝 Creating production environment (.env.prod)..."
cat > .env.prod << 'EOF'
# Production Environment Configuration
NODE_ENV=production
PORT=5001
HOST=0.0.0.0

# Production Database Configuration
DATABASE_URL=postgresql://dtvisuals:CHANGE_THIS_PASSWORD@localhost:5432/dtvisuals_prod

# Production Session Configuration - CHANGE THIS IN PRODUCTION!
SESSION_SECRET=CHANGE_THIS_TO_SECURE_RANDOM_64_CHAR_STRING

# Application Configuration
ENABLE_TIMELINE=true
VIDEO_UPLOAD_LIMIT=100MB
TIMELINE_NOTES_MAX_LENGTH=5000

# Production specific settings
DEBUG=false
DOMAIN=dtvisuals.com
EOF

# Create development environment file
echo "📝 Creating development environment (.env.dev)..."
cat > .env.dev << 'EOF'
# Development Environment Configuration
NODE_ENV=development
PORT=5002
HOST=0.0.0.0

# Development Database Configuration
DATABASE_URL=postgresql://dtvisuals:CHANGE_THIS_PASSWORD@localhost:5432/dtvisuals_dev

# Development Session Configuration
SESSION_SECRET=CHANGE_THIS_TO_SECURE_RANDOM_64_CHAR_STRING

# Application Configuration
ENABLE_TIMELINE=true
VIDEO_UPLOAD_LIMIT=100MB
TIMELINE_NOTES_MAX_LENGTH=5000

# Development specific settings
DEBUG=true
DOMAIN=dev.dtvisuals.com
EOF

# Set proper ownership
chown dtvisuals:dtvisuals .env.prod .env.dev
chmod 600 .env.prod .env.dev

echo "✅ Environment files created!"
echo ""
echo "🔧 IMPORTANT: You must now configure:"
echo "1. Database passwords in both files"
echo "2. Session secrets (use: openssl rand -hex 64)"
echo ""
echo "📝 Edit production settings:"
echo "   sudo -u dtvisuals nano .env.prod"
echo ""
echo "📝 Edit development settings:"
echo "   sudo -u dtvisuals nano .env.dev"
echo ""
echo "🔑 Generate secure session secrets:"
echo "   openssl rand -hex 64"