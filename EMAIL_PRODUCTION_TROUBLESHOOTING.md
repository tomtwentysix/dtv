# Email Service Troubleshooting Guide

This guide helps resolve the "Email service not configured" error in production.

## Quick Diagnosis

### 1. Check Email Service Status
```bash
curl http://localhost:5001/api/email/debug
```

This will show:
- Environment variables status
- Email service configuration
- Working directory and timestamp

### 2. Check Application Health
```bash
curl http://localhost:5001/api/health
```

Look for the `email` section in the response.

### 3. Check PM2 Status
```bash
sudo -u dtvisuals pm2 status
sudo -u dtvisuals pm2 logs dtvisuals-prod --lines 50
```

## Common Issues and Solutions

### Issue 1: Environment File Not Found
**Symptoms**: Logs show "Environment file not found" or SMTP_HOST is "NOT SET"

**Solution**:
```bash
# Check if .env.prod exists in the correct location
ls -la /var/www/dtvisuals/app/.env.prod

# If missing, copy from the repository
sudo -u dtvisuals cp /path/to/repo/.env.prod /var/www/dtvisuals/app/.env.prod

# Restart PM2
sudo -u dtvisuals pm2 restart dtvisuals-prod
```

### Issue 2: PM2 Not Loading Environment File
**Symptoms**: File exists but SMTP variables still show "NOT SET"

**Solution 1 - Verify PM2 Configuration**:
```bash
sudo -u dtvisuals pm2 show dtvisuals-prod
# Check that env_file points to correct path
```

**Solution 2 - Restart PM2**:
```bash
sudo -u dtvisuals pm2 restart dtvisuals-prod
```

**Solution 3 - Reinitialize Email Service**:
```bash
curl -X POST http://localhost:5001/api/email/reinitialize
```

### Issue 3: Wrong Environment File Path
**Symptoms**: PM2 shows different working directory

**Check Current Setup**:
```bash
sudo -u dtvisuals pm2 show dtvisuals-prod | grep -E "cwd|env_file"
```

**Expected Values**:
- cwd: `/var/www/dtvisuals/app`
- env_file: `/var/www/dtvisuals/app/.env.prod`

## Environment File Validation

The .env.prod file should contain these SMTP settings:
```bash
SMTP_HOST=dtvisuals-com.mail.protection.outlook.com
SMTP_PORT=25
SMTP_SECURE=false
SMTP_REQUIRE_TLS=true
SMTP_FROM=contactform@dtvisuals.com
SMTP_TO=hello@dtvisuals.com
```

### Validate Environment File:
```bash
sudo -u dtvisuals cat /var/www/dtvisuals/app/.env.prod | grep SMTP
```

## Testing Email Functionality

### 1. Test Contact Form
```bash
curl -X POST http://localhost:5001/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "projectType": "documentary",
    "message": "Test message"
  }'
```

### 2. Check Logs After Test
```bash
sudo -u dtvisuals pm2 logs dtvisuals-prod --lines 20
```

## Expected Log Output (Working)

When email service is working correctly, you should see:
```
📧 Initializing EmailService...
📧 Environment Variables Debug: { SMTP_HOST: 'dtvisuals-com.mail.p...', ... }
🔧 Initializing SMTP transporter...
ℹ️  SMTP configuration loaded without authentication (relay mode)
✅ SMTP transporter created successfully
```

## Expected Log Output (Not Working)

When there's an issue:
```
📧 Environment Variables Debug: { SMTP_HOST: 'NOT SET', ... }
❌ SMTP host not configured - email sending disabled
💡 Check that .env.prod file exists and is being loaded correctly by PM2
```

## Step-by-Step Fix Process

1. **Check current status**:
   ```bash
   curl http://localhost:5001/api/email/debug
   ```

2. **Verify environment file**:
   ```bash
   ls -la /var/www/dtvisuals/app/.env.prod
   cat /var/www/dtvisuals/app/.env.prod | grep SMTP
   ```

3. **Check PM2 configuration**:
   ```bash
   sudo -u dtvisuals pm2 show dtvisuals-prod
   ```

4. **Restart service**:
   ```bash
   sudo -u dtvisuals pm2 restart dtvisuals-prod
   ```

5. **Verify fix**:
   ```bash
   curl http://localhost:5001/api/email/debug
   ```

6. **Test contact form**:
   ```bash
   curl -X POST http://localhost:5001/api/contact -H "Content-Type: application/json" -d '{"firstName":"Test","lastName":"User","email":"test@example.com","projectType":"documentary","message":"Test message"}'
   ```

## Advanced Troubleshooting

### Manual Environment Loading Test
```bash
# Test loading environment manually
sudo -u dtvisuals bash -c 'cd /var/www/dtvisuals/app && node -e "
require(\"dotenv\").config({path: \".env.prod\"});
console.log(\"SMTP_HOST:\", process.env.SMTP_HOST);
console.log(\"SMTP_FROM:\", process.env.SMTP_FROM);
"'
```

### PM2 Environment Debug
```bash
# Show all environment variables PM2 is using
sudo -u dtvisuals pm2 env dtvisuals-prod
```

This should resolve the "Email service not configured" error in production.