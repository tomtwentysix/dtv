# DT Visuals Deployment Guide

This guide walks you through deploying DT Visuals to your server using GitHub Actions with automatic SSL certificates and dual environment support.

## 🎯 What You'll Get

- **Production site**: https://dtvisuals.com
- **Development site**: https://dev.dtvisuals.com  
- **Automatic SSL certificates** via Let's Encrypt
- **Separate databases** for production and development
- **Persistent file uploads** for both environments
- **Zero-downtime deployments** via GitHub Actions

## 📋 Prerequisites

### Server Requirements
- Linux server with root/sudo access
- Domain name with DNS pointing to your server:
  - `dtvisuals.com` → Your server IP
  - `dev.dtvisuals.com` → Your server IP
- Ports 80 and 443 open for web traffic

### GitHub Requirements
- GitHub repository (public or private)
- GitHub Personal Access Token with appropriate permissions

## 🚀 Step 1: Server Preparation

### Install Docker
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# Log out and back in, then test
docker --version
docker-compose --version
```

### Set Up GitHub Authentication (For Private Repos)

If your repository is private, you have several options:

**Option 1: Clone Repository (Recommended)**
```bash
# Clone your private repository
git clone https://github.com/YOUR_USERNAME/dtv.git
cd dtv

# Run authentication script
chmod +x auth-setup.sh
./auth-setup.sh
```

**Option 2: Manual File Copy**
- Download `auth-setup.sh` from your GitHub repository web interface
- Upload to your server via SCP/SFTP
- Make executable: `chmod +x auth-setup.sh`
- Run: `./auth-setup.sh`

**Option 3: GitHub CLI**
```bash
# Install GitHub CLI
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list
sudo apt update && sudo apt install gh

# Authenticate and download
gh auth login
gh repo clone YOUR_USERNAME/dtv
cd dtv
chmod +x auth-setup.sh
./auth-setup.sh
```

**Option 4: Environment Variables**
```bash
# Set authentication variables for both scripts
export GITHUB_USERNAME=your-github-username
export GITHUB_TOKEN=your-personal-access-token

# Run setup without prompts
./setup-dual-deploy.sh
```

When prompted:
1. **GitHub Username**: Your GitHub username
2. **Personal Access Token**: Create one at https://github.com/settings/tokens/new
   - Select scope: `read:packages`
   - Copy the generated token

## 🔧 Step 2: GitHub Repository Setup

### Add Repository Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add these secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `SERVER_HOST` | `your-server-ip` | Your server's IP address |
| `SERVER_USER` | `your-username` | SSH username for your server |
| `SERVER_SSH_KEY` | `-----BEGIN PRIVATE KEY-----...` | Your SSH private key |

### Generate SSH Key (if needed)

On your server:
```bash
# Generate SSH key pair
ssh-keygen -t rsa -b 4096 -C "github-actions"

# Add public key to authorized_keys
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys

# Copy private key for GitHub secret
cat ~/.ssh/id_rsa
```

### Set Environment Variables (For Private Repos)

If using a private repository, set these on your server:
```bash
# Add to ~/.bashrc or ~/.profile for persistence
echo 'export GITHUB_USERNAME=your-github-username' >> ~/.bashrc
echo 'export GITHUB_TOKEN=your-personal-access-token' >> ~/.bashrc
source ~/.bashrc

# Or set temporarily for current session
export GITHUB_USERNAME=your-github-username
export GITHUB_TOKEN=your-personal-access-token
```

## 🏗️ Step 3: Server Deployment Setup

### Download Deployment Files

SSH into your server and choose the appropriate method:

**For Public Repositories:**
```bash
# Download and run setup script
wget https://raw.githubusercontent.com/YOUR_USERNAME/dtv/main/setup-dual-deploy.sh
chmod +x setup-dual-deploy.sh
./setup-dual-deploy.sh
```

**For Private Repositories:**
```bash
# Clone repository (if not already done)
git clone https://github.com/YOUR_USERNAME/dtv.git
cd dtv

# Run setup script
chmod +x setup-dual-deploy.sh
./setup-dual-deploy.sh
```

**Alternative: Manual Setup**
If you prefer not to clone the entire repository:

```bash
# Create deployment directory
sudo mkdir -p /opt/dt-visuals
sudo chown $USER:$USER /opt/dt-visuals
cd /opt/dt-visuals

# Manually copy these files from your repository:
# - docker-compose.dual.yml → docker-compose.yml
# - nginx.conf
# - .env.dual → .env
```

### Configure Environment

Edit the `.env` file in `/opt/dt-visuals/`:

```bash
cd /opt/dt-visuals
nano .env
```

Update these values:
```env
# GitHub repository info
GITHUB_REPOSITORY_OWNER=your-github-username

# Let's Encrypt email
ACME_EMAIL=your-email@example.com

# Database Passwords (generate secure passwords)
PROD_DB_PASSWORD=your-very-secure-production-db-password
DEV_DB_PASSWORD=your-secure-development-db-password

# Session Secrets (generate with: openssl rand -base64 32)
PROD_SESSION_SECRET=your-very-secure-production-session-secret
DEV_SESSION_SECRET=your-secure-development-session-secret
```

### Generate Secure Passwords

```bash
# Generate database passwords
openssl rand -base64 32  # For PROD_DB_PASSWORD
openssl rand -base64 32  # For DEV_DB_PASSWORD

# Generate session secrets  
openssl rand -base64 32  # For PROD_SESSION_SECRET
openssl rand -base64 32  # For DEV_SESSION_SECRET
```

## 🚀 Step 4: Deploy via GitHub

### Trigger Deployment

Push any commit to your GitHub repository:

```bash
# Make a small change and push
git add .
git commit -m "Deploy to production"
git push origin main
```

### Monitor Deployment

1. Go to your GitHub repository → Actions tab
2. Watch the deployment workflow run
3. Check the logs for any issues

### Server Deployment Process

The GitHub Action will:
1. Build production and development Docker images
2. Push images to GitHub Container Registry
3. SSH into your server
4. Pull latest images
5. Restart services with zero downtime

## 🔍 Step 5: Verification

### Check Services

On your server:
```bash
cd /opt/dt-visuals

# Check all services are running
docker-compose ps

# Check logs
docker-compose logs nginx
docker-compose logs app-prod
docker-compose logs app-dev
docker-compose logs db-prod
docker-compose logs db-dev
```

### Test Websites

- **Production**: https://dtvisuals.com
- **Development**: https://dev.dtvisuals.com

Both should load with valid SSL certificates.

### Verify Database Connectivity

```bash
# Test production database
docker-compose exec db-prod psql -U dtvisuals -d dt_visuals_prod -c "\\dt"

# Test development database  
docker-compose exec db-dev psql -U dtvisuals -d dt_visuals_dev -c "\\dt"
```

## 🔄 Step 6: Ongoing Deployments

### Automatic Deployments

Every push to `main` branch automatically deploys to production.

### Manual Deployment

If needed, manually trigger deployment:

```bash
# On your server
cd /opt/dt-visuals
docker-compose pull
docker-compose up -d
```

### Database Management

```bash
# Backup production database
docker-compose exec db-prod pg_dump -U dtvisuals dt_visuals_prod > backup_$(date +%Y%m%d).sql

# View database logs
docker-compose logs db-prod
docker-compose logs db-dev
```

### SSL Certificate Renewal

Certificates auto-renew, but to manually renew:

```bash
cd /opt/dt-visuals
docker-compose run --rm certbot renew
docker-compose restart nginx
```

## 🗂️ File Structure

Your deployment will create this structure:

```
/opt/dt-visuals/
├── docker-compose.yml       # Container orchestration
├── nginx.conf              # Web server configuration  
├── .env                    # Environment variables
└── ssl/                    # SSL certificates
    ├── privkey.pem
    └── fullchain.pem
```

## 🔧 Troubleshooting

### Common Issues

**503 Service Unavailable**
```bash
# Check if containers are running
docker-compose ps

# Restart services
docker-compose restart
```

**SSL Certificate Issues**
```bash
# Check certificate status
docker-compose logs certbot

# Manual certificate generation
docker-compose run --rm certbot
```

**Database Connection Failed**
```bash
# Check database logs
docker-compose logs db-prod

# Verify environment variables
docker-compose exec app-prod env | grep DATABASE_URL
```

**GitHub Actions Failed**
- Check repository secrets are set correctly
- Verify SSH key has correct permissions
- Check server disk space: `df -h`

### Log Locations

```bash
# Application logs
docker-compose logs app-prod
docker-compose logs app-dev

# Nginx logs
docker-compose logs nginx

# Database logs
docker-compose logs db-prod
docker-compose logs db-dev

# System logs
journalctl -u docker
```

## 🎉 Success!

Your DT Visuals application is now deployed with:

- ✅ **Dual environments** (production + development)
- ✅ **Automatic SSL certificates** 
- ✅ **Persistent databases** with backups
- ✅ **File upload storage** 
- ✅ **Zero-downtime deployments**
- ✅ **GitHub Actions CI/CD**

Push to GitHub and watch your site automatically deploy! 🚀