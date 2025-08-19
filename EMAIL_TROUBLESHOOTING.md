# Email Service Troubleshooting Guide

This document provides troubleshooting steps for email service issues in the DT Visuals application.

## Quick Diagnosis

### 1. Check Health Endpoint

Visit `/api/health` to check the current email service status:

```json
{
  "status": "healthy",
  "timestamp": "2024-08-19T20:43:54.407Z", 
  "environment": "production",
  "email": {
    "configured": true,
    "hasTransporter": true,
    "config": {
      "host": "dtvisuals-com.mail.protection.outlook.com",
      "port": "25",
      "from": "contactform@dtvisuals.com",
      "to": "hello@dtvisuals.com",
      "hasAuth": false
    }
  }
}
```

**Expected values:**
- `email.configured`: `true` (SMTP_HOST is set)
- `email.hasTransporter`: `true` (transporter created successfully)

### 2. Check Server Logs

Look for these log messages on application startup:

✅ **Good:**
```
📧 Initializing EmailService...
📧 Email configuration: { from: '...', to: '...', hasSmtpHost: true }
🔧 Initializing SMTP transporter...
ℹ️  SMTP configuration loaded without authentication (relay mode)
✅ SMTP transporter created successfully
```

❌ **Problems:**
```
❌ SMTP host not configured - email sending disabled
❌ Failed to create SMTP transporter: [error details]
```

## Environment Configuration

### Required Variables (.env.prod)

```env
# SMTP Configuration for Office 365/Exchange
SMTP_HOST=dtvisuals-com.mail.protection.outlook.com
SMTP_PORT=25
SMTP_SECURE=false
SMTP_REQUIRE_TLS=true
SMTP_FROM=contactform@dtvisuals.com
SMTP_TO=hello@dtvisuals.com
```

### Optional Authentication Variables

If your SMTP server requires authentication, add:

```env
SMTP_USER=your-username
SMTP_PASS=your-password
```

**Note:** Office 365 mail protection relay typically doesn't require authentication when properly configured.

## Testing Email Functionality

### Admin Test Endpoint

If you have admin access, test email sending via:

**POST** `/api/admin/email/test`

Headers:
```
Authorization: Bearer <your-admin-token>
Content-Type: application/json
```

This will:
1. Check email service status
2. Test SMTP connection
3. Send a test email
4. Return detailed diagnostics

### Manual Contact Form Test

1. Navigate to the contact form on your website
2. Fill out and submit the form
3. Check server logs for:
   ```
   Contact form submission: { firstName: '...', ... }
   📧 Attempting to send email...
   ✅ Contact form email sent successfully to hello@dtvisuals.com
   ```

## Common Issues & Solutions

### Issue: "Email service not configured - skipping email send"

**Cause:** SMTP transporter is null

**Solutions:**
1. Check that `SMTP_HOST` is set in your environment file
2. Verify environment file is being loaded correctly by PM2
3. Check for typos in environment variable names
4. Restart the application: `pm2 restart dtvisuals-prod`

### Issue: "SMTP connection test failed"

**Cause:** Network connectivity issues

**Solutions:**
1. Verify DNS resolution: `nslookup dtvisuals-com.mail.protection.outlook.com`
2. Check firewall rules for outbound SMTP (port 25)
3. Test network connectivity: `telnet dtvisuals-com.mail.protection.outlook.com 25`
4. Verify server can reach external SMTP servers

### Issue: Authentication errors

**Cause:** SMTP server requires authentication but credentials not provided/incorrect

**Solutions:**
1. Add `SMTP_USER` and `SMTP_PASS` to environment
2. Verify credentials are correct
3. Check if IP address needs to be whitelisted on SMTP server

## PM2 Configuration

Ensure your `ecosystem.config.js` correctly loads the environment:

```javascript
{
  name: 'dtvisuals-prod',
  env_file: '/var/www/dtvisuals/app/.env.prod',
  // ... other config
}
```

## Network Requirements

### Outbound Ports
- **Port 25**: SMTP (non-encrypted)
- **Port 587**: SMTP with STARTTLS
- **Port 465**: SMTP over SSL

### DNS Resolution
The server must be able to resolve:
- `dtvisuals-com.mail.protection.outlook.com`

## Monitoring

Set up monitoring for:
1. Failed email sends in application logs
2. SMTP connection timeouts
3. DNS resolution failures
4. Disk space (for log files)

## Contact Form Behavior

The contact form will:
- ✅ **Email Success**: Show "Message sent successfully via email"
- ❌ **Email Failed**: Show "Message received successfully" (hides technical details from users)
- ❌ **Server Error**: Show "Failed to send message"

The user experience remains consistent even if email fails, but detailed errors are logged server-side for troubleshooting.