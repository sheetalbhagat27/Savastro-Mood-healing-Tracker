import { wrapEmailTemplate, escapeHtml } from './baseEmailTemplate.js';

export const createVerificationEmail = ({ name, verificationUrl }) => {
  const safeName = escapeHtml(name || 'Friend');

  const contentHtml = `
    <h1>Verify Your Email Address</h1>
    <p>Namaste <b>${safeName}</b>,</p>
    <p>
      Thank you for creating your account with <b>Savastro – Mood &amp; Healing Tracker</b>.
      To activate your profile and begin tracking your emotional wellness and daily healing remedies, please verify your email address.
    </p>
    <div class="btn-container">
      <a href="${verificationUrl}" class="btn" target="_blank" rel="noopener noreferrer">
        Verify My Email
      </a>
    </div>
    <div class="highlight-box">
      This verification link is valid for <b>24 hours</b> and can only be used once. If the button above does not work, copy and paste this link into your browser:
      <br><br>
      <a href="${verificationUrl}" style="color: #4cd7f6; word-break: break-all;">${verificationUrl}</a>
    </div>
    <p style="font-size: 13px; color: #9aa0b6;">
      If you did not create a Savastro account, you can safely disregard this email.
    </p>
  `;

  const text = `Namaste ${safeName},

Thank you for registering with Savastro – Mood & Healing Tracker.
Please verify your email address by clicking the link below (valid for 24 hours):

${verificationUrl}

If you did not sign up for Savastro, you can safely ignore this email.

Warm regards,
Savastro Team
`;

  return {
    subject: 'Verify Your Email – Savastro Mood & Healing Tracker',
    html: wrapEmailTemplate({
      title: 'Verify Your Email – Savastro',
      preheader: 'Complete your registration on Savastro to begin your healing journey.',
      contentHtml
    }),
    text
  };
};

export default createVerificationEmail;
