import { createTransporter, getEmailConfig } from '../config/email.js';
import { createVerificationEmail } from '../templates/verificationEmail.js';
import { createWelcomeEmail } from '../templates/welcomeEmail.js';
import { createLoginNotificationEmail } from '../templates/loginNotificationEmail.js';
import { createPasswordResetEmail } from '../templates/passwordResetEmail.js';

class EmailService {
  constructor() {
    this.transporter = null;
  }

  getTransporter() {
    if (!this.transporter) {
      this.transporter = createTransporter();
    }
    return this.transporter;
  }

  getFrontendUrl() {
    return (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
  }

  /**
   * Internal dispatcher for sending emails safely.
   */
  async sendMail({ to, subject, html, text }) {
    const config = getEmailConfig();

    if (!config.isConfigured) {
      console.log(`[EmailService Simulated] To: ${to} | Subject: "${subject}"`);
      return { success: true, simulated: true };
    }

    try {
      const transporter = this.getTransporter();
      if (!transporter) {
        console.warn(`[EmailService] Transporter unavailable. Simulating delivery to ${to}`);
        return { success: true, simulated: true };
      }

      const info = await transporter.sendMail({
        from: config.from,
        to,
        subject,
        html,
        text
      });

      console.log(`[EmailService] Email sent successfully to ${to} (Message ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`[EmailService] Failed to send email to ${to}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sends an email verification link.
   */
  async sendVerificationEmail(user, rawToken) {
    const baseUrl = this.getFrontendUrl();
    const verificationUrl = `${baseUrl}/?action=verify-email&token=${rawToken}&email=${encodeURIComponent(user.email)}`;

    const template = createVerificationEmail({
      name: user.name,
      verificationUrl
    });

    console.log(`[EmailService Link] Verification Link for ${user.email}: ${verificationUrl}`);
    return this.sendMail({
      to: user.email,
      ...template
    });
  }

  /**
   * Sends a welcome email once verified or registered.
   */
  async sendWelcomeEmail(user) {
    const dashboardUrl = this.getFrontendUrl();
    const template = createWelcomeEmail({
      name: user.name,
      dashboardUrl
    });

    return this.sendMail({
      to: user.email,
      ...template
    });
  }

  /**
   * Sends a login notification email.
   */
  async sendLoginNotification(user, context = {}) {
    if (process.env.SEND_LOGIN_NOTIFICATION === 'false') {
      return { success: true, disabled: true };
    }

    const accountUrl = this.getFrontendUrl();
    const template = createLoginNotificationEmail({
      name: user.name,
      date: context.date || new Date(),
      ip: context.ip,
      userAgent: context.userAgent,
      accountUrl
    });

    return this.sendMail({
      to: user.email,
      ...template
    });
  }

  /**
   * Sends a password reset email with a secure link.
   */
  async sendPasswordResetEmail(user, rawToken) {
    const baseUrl = this.getFrontendUrl();
    const resetUrl = `${baseUrl}/?action=reset-password&token=${rawToken}&email=${encodeURIComponent(user.email)}`;

    const template = createPasswordResetEmail({
      name: user.name,
      resetUrl,
      expiresInMinutes: 60
    });

    console.log(`[EmailService Link] Password Reset Link for ${user.email}: ${resetUrl}`);
    return this.sendMail({
      to: user.email,
      ...template
    });
  }
}

export const emailService = new EmailService();
export default emailService;
