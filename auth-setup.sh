#!/bin/bash

# GitHub Container Registry Authentication Setup
# Run this on your server for private repository access

echo "🔐 Setting up GitHub Container Registry Authentication"
echo "==================================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

print_info "For private repositories, your server needs authentication to pull container images."
echo ""
print_warning "You need to create a GitHub Personal Access Token:"
echo "1. Go to: https://github.com/settings/tokens/new"
echo "2. Give it a name like 'Server Docker Access'"
echo "3. Select scope: 'read:packages'"
echo "4. Click 'Generate token'"
echo "5. Copy the token (you won't see it again!)"
echo ""

read -p "Enter your GitHub username: " github_username
read -s -p "Enter your GitHub Personal Access Token: " github_token
echo ""

print_info "Testing authentication..."
echo $github_token | docker login ghcr.io -u $github_username --password-stdin

if [ $? -eq 0 ]; then
    print_success "Authentication successful!"
    
    # Save credentials for automatic login
    print_info "Saving authentication for future use..."
    
    # Create systemd service for auto-login on boot
    sudo tee /etc/systemd/system/github-docker-login.service > /dev/null <<EOF
[Unit]
Description=GitHub Container Registry Login
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
User=$USER
ExecStart=/bin/bash -c 'echo $github_token | docker login ghcr.io -u $github_username --password-stdin'
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl enable github-docker-login.service
    sudo systemctl start github-docker-login.service
    
    print_success "Authentication setup complete!"
    print_info "Your server can now pull private container images automatically."
    
else
    print_warning "Authentication failed. Please check your token and try again."
    exit 1
fi