import nodemailer from 'nodemailer';

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
    this.from = process.env.SMTP_FROM || '';
    this.to = process.env.SMTP_TO || 'hello@dt.visuals';
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    // Only initialize if SMTP host is present
    if (!process.env.SMTP_HOST) {
      console.log('SMTP host not configured - email sending disabled');
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
      console.log('SMTP configuration loaded with authentication');
    } else {
      console.log('SMTP configuration loaded without authentication (relay mode)');
    }

    this.transporter = nodemailer.createTransport(config);
  }

  async sendContactFormEmail(data: ContactFormData): Promise<boolean> {
    if (!this.transporter) {
      console.log('Email service not configured - skipping email send');
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
      await this.transporter.sendMail(mailOptions);
      console.log(`Contact form email sent successfully to ${this.to}`);
      return true;
    } catch (error) {
      console.error('Failed to send contact form email:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('SMTP connection test failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();