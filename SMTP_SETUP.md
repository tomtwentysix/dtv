# SMTP Email Configuration for Contact Form

This document explains how to configure SMTP email sending for the contact form using Office 365/Exchange.

## Configuration

To enable email sending for contact form submissions, add the following environment variables to your `.env.prod` or `.env.dev` file:

```bash
# SMTP Configuration for Office 365/Exchange
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@yourdomain.com
SMTP_TO=hello@dt.visuals
```

### Office 365/Exchange Setup

1. **SMTP Settings:**
   - Host: `smtp.office365.com`
   - Port: `587` (STARTTLS)
   - Security: STARTTLS

2. **Authentication:**
   - Use your Office 365 email address for `SMTP_USER`
   - For `SMTP_PASS`, you may need to use an app password instead of your regular password
   - To create an app password, go to your Microsoft account security settings

3. **Email Addresses:**
   - `SMTP_FROM`: The email address that will appear as the sender
   - `SMTP_TO`: The email address where contact form submissions will be sent

## How It Works

1. When a user submits the contact form, the server attempts to send an email via SMTP
2. If SMTP is not configured, the system logs the message and returns a success response (graceful degradation)
3. If SMTP is configured but sending fails, the system logs the error and still returns success to avoid exposing system details
4. Email content includes all form fields formatted in both HTML and plain text

## Testing

To test the email functionality:

1. Configure the SMTP environment variables
2. Submit a test message through the contact form
3. Check the configured `SMTP_TO` email address for the message
4. Review server logs for any SMTP connection issues

## Security Notes

- Never commit actual SMTP credentials to version control
- Use environment variables for all sensitive configuration
- Consider using app passwords instead of regular passwords for enhanced security
- The system gracefully handles missing or invalid SMTP configuration without exposing errors to users