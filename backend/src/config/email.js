import nodemailer from 'nodemailer';

/**
 * Creates and configures the Nodemailer transporter.
 * Uses environment variables for complete externalization of credentials.
 */
export const getEmailConfig = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || 'Savastro <no-reply@savastro.com>';

  const isConfigured = Boolean(host && user && pass);

  return {
    host,
    port,
    secure,
    auth: isConfigured ? { user, pass } : null,
    from,
    isConfigured
  };
};

export const createTransporter = () => {
  const config = getEmailConfig();

  if (!config.isConfigured) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
  });
};

export const verifyEmailConfig = async () => {
  const transporter = createTransporter();
  if (!transporter) {
    return {
      configured: false,
      message: 'SMTP credentials not configured. Outbound emails will be simulated in logs.'
    };
  }

  try {
    await transporter.verify();
    return { configured: true, message: 'SMTP server is reachable and credentials are valid.' };
  } catch (error) {
    return {
      configured: true,
      reachable: false,
      error: error.message
    };
  }
};

export default { getEmailConfig, createTransporter, verifyEmailConfig };
