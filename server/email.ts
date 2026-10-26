import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  projectType: string;
  message: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private from: string;
  private to: string;

  constructor() {
    console.log('📧 Initializing EmailService...');
    
    // Debug: Show all SMTP-related environment variables
    console.log('📧 Environment Variables Debug:', {
      NODE_ENV: process.env.NODE_ENV,
      SMTP_HOST: process.env.SMTP_HOST ? `${process.env.SMTP_HOST.substring(0, 20)}...` : 'NOT SET',
      SMTP_PORT: process.env.SMTP_PORT || 'NOT SET',
      SMTP_SECURE: process.env.SMTP_SECURE || 'NOT SET',
      SMTP_REQUIRE_TLS: process.env.SMTP_REQUIRE_TLS || 'NOT SET',
      SMTP_FROM: process.env.SMTP_FROM ? `${process.env.SMTP_FROM.substring(0, 10)}...` : 'NOT SET',
      SMTP_TO: process.env.SMTP_TO ? `${process.env.SMTP_TO.substring(0, 10)}...` : 'NOT SET',
      SMTP_USER: process.env.SMTP_USER ? 'SET' : 'NOT SET',
      SMTP_PASS: process.env.SMTP_PASS ? 'SET' : 'NOT SET',
    });
    
    // If in production and SMTP_HOST is not set, try to load .env.prod directly as a fallback
    if (process.env.NODE_ENV === 'production' && !process.env.SMTP_HOST) {
      console.log('⚠️  Production mode but SMTP_HOST not found - attempting fallback env loading');
      try {
        // Try multiple possible locations for the .env.prod file
        const possiblePaths = [
          '.env.prod',
          '/var/www/dtvisuals/app/.env.prod',
          path.join(process.cwd(), '.env.prod')
        ];
        
        for (const envPath of possiblePaths) {
          if (fs.existsSync(envPath)) {
            console.log(`🔧 Found .env.prod at ${envPath}, loading as fallback`);
            dotenv.config({ path: envPath });
            break;
          }
        }
        
        // Log the result
        console.log('📧 After fallback loading - SMTP_HOST:', process.env.SMTP_HOST ? 'SET' : 'STILL NOT SET');
      } catch (error) {
        console.warn('⚠️  Fallback environment loading failed:', error.message);
      }
    }
    
    this.from = process.env.SMTP_FROM || '';
    this.to = process.env.SMTP_TO || 'hello@dt.visuals';
    
    console.log('📧 Email configuration:', {
      from: this.from,
      to: this.to,
      hasSmtpHost: !!process.env.SMTP_HOST
    });
    
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    console.log('🔧 Initializing SMTP transporter...');
    
    // Only initialize if SMTP host is present
    if (!process.env.SMTP_HOST) {
      console.log('❌ SMTP host not configured - email sending disabled');
      console.log('   Required environment variable SMTP_HOST is missing');
      console.log('   💡 Check that .env.prod file exists and is being loaded correctly by PM2');
      console.log('   💡 Verify PM2 ecosystem.config.js env_file path is correct');
      return;
    }

    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true';
    const requireTLS = process.env.SMTP_REQUIRE_TLS === 'true';

    const config: any = {
      host: process.env.SMTP_HOST,
      port: port,
      secure: secure, // Use SSL/TLS if specified
      requireTLS: requireTLS, // Force TLS if specified
    };

    // Add authentication only if both user and password are provided
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      config.auth = {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      };
      console.log('✅ SMTP configuration loaded with authentication');
    } else {
      console.log('ℹ️  SMTP configuration loaded without authentication (relay mode)');
      console.log('   This is normal for Office 365 mail protection relay');
    }

    console.log('🔧 SMTP Config:', {
      host: config.host,
      port: config.port,
      secure: config.secure,
      requireTLS: config.requireTLS,
      hasAuth: !!config.auth
    });

    try {
      this.transporter = nodemailer.createTransport(config);
      console.log('✅ SMTP transporter created successfully');
    } catch (error) {
      console.error('❌ Failed to create SMTP transporter:', error);
      this.transporter = null;
    }
  }

  async sendContactFormEmail(data: ContactFormData): Promise<boolean> {
    if (!this.transporter) {
      console.log('❌ Email service not configured - skipping email send');
      console.log('   Transporter is null - check SMTP configuration');
      console.log('   💡 This usually means SMTP_HOST environment variable is not set');
      console.log('   💡 Check PM2 logs and environment file loading');
      return false;
    }

    const { firstName, lastName, email, projectType, message } = data;

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: `New Contact Form Submission from ${firstName} ${lastName}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Project Type:</strong> ${projectType}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><em>This email was sent from the dt.visuals contact form.</em></p>
      `,
      text: `
New Contact Form Submission

Name: ${firstName} ${lastName}
Email: ${email}
Project Type: ${projectType}
Message:
${message}

This email was sent from the dt.visuals contact form.
      `,
    };

    try {
      console.log('📧 Attempting to send email...', {
        from: this.from,
        to: this.to,
        subject: mailOptions.subject
      });
      
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Contact form email sent successfully to ${this.to}`);
      console.log('📧 Email result:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send contact form email:', error.message);
      console.error('📧 Full error details:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      console.log('❌ Cannot test connection - transporter is null');
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('❌ SMTP connection test failed:', error.message);
      // In production, this might fail due to network restrictions but emails might still work
      return false;
    }
  }

  getServiceStatus(): { configured: boolean; hasTransporter: boolean; config: any } {
    return {
      configured: !!process.env.SMTP_HOST,
      hasTransporter: !!this.transporter,
      config: {
        host: process.env.SMTP_HOST || 'not set',
        port: process.env.SMTP_PORT || 'not set',
        from: this.from || 'not set',
        to: this.to || 'not set',
        hasAuth: !!(process.env.SMTP_USER && process.env.SMTP_PASS)
      }
    };
  }
  
  // Method to reinitialize the service if environment variables were loaded later
  reinitialize(): void {
    console.log('🔄 Reinitializing Email Service...');
    this.from = process.env.SMTP_FROM || '';
    this.to = process.env.SMTP_TO || 'hello@dt.visuals';
    this.transporter = null;
    this.initializeTransporter();
  }
}

export const emailService = new EmailService();