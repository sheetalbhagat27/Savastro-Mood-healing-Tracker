import { wrapEmailTemplate } from './baseEmailTemplate.js';

export const createPasswordResetEmail = ({ name, resetUrl, expiresInMinutes = 60 }) => {
  const safeName = name ? name.replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'Friend';

  const contentHtml = `
    <h1>Password Reset Request</h1>
    <p>Namaste <b>${safeName}</b>,</p>
    <p>
      We received a request to reset the password for your <b>Savastro</b> account.
      Click the button below to choose a new password:
    </p>
    <div class="btn-container">
      <a href="${resetUrl}" class="btn" target="_blank" rel="noopener noreferrer">
        Reset My Password
      </a>
    </div>
    <div class="highlight-box">
      This password reset link is strictly confidential, single-use, and expires in <b>${expiresInMinutes} minutes</b>.
      <br><br>
      Direct link: <a href="${resetUrl}" style="color: #4cd7f6; word-break: break-all;">${resetUrl}</a>
    </div>
    <div style="background-color: #241a20; border: 1px solid #ffb4ab; border-radius: 12px; padding: 14px; margin: 16px 0; font-size: 13px; color: #ffb4ab;">
      <b>Didn't request a password reset?</b><br>
      You can safely ignore this email. Your existing password will remain unchanged and your account stays protected.
    </div>
  `;

  const text = `Namaste ${safeName},

We received a request to reset the password for your Savastro account.
Use the link below to choose a new password (valid for ${expiresInMinutes} minutes):

${resetUrl}

If you did not request this, please disregard this email. Your password will not change.

Warm regards,
Savastro Security Team
`;

  return {
    subject: 'Reset Your Savastro Password',
    html: wrapEmailTemplate({
      title: 'Reset Your Password – Savastro',
      preheader: 'Confidential link to reset your Savastro password.',
      contentHtml
    }),
    text
  };
};

export default createPasswordResetEmail;
