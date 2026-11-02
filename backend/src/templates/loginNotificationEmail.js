import { wrapEmailTemplate } from './baseEmailTemplate.js';

export const createLoginNotificationEmail = ({ name, date, ip, userAgent, accountUrl }) => {
  const safeName = name ? name.replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'Friend';
  const formattedDate = date ? new Date(date).toUTCString() : new Date().toUTCString();
  const safeIp = ip || 'Unavailable';
  const safeDevice = userAgent ? userAgent.slice(0, 120).replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'Web Browser';

  const contentHtml = `
    <h1>New Sign-in to Your Account</h1>
    <p>Namaste <b>${safeName}</b>,</p>
    <p>
      We detected a successful sign-in to your <b>Savastro</b> account. Here are the activity details:
    </p>
    <div class="highlight-box">
      <div style="margin-bottom: 6px;"><b>Timestamp:</b> ${formattedDate}</div>
      <div style="margin-bottom: 6px;"><b>IP Address:</b> ${safeIp}</div>
      <div><b>Device / Browser:</b> ${safeDevice}</div>
    </div>
    <p>
      If this was you, you can safely disregard this notice. No action is required.
    </p>
    <div style="background-color: #241a20; border: 1px solid #ffb4ab; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px; color: #ffb4ab;">
      <b>Don't recognize this sign-in?</b><br>
      Someone else may have accessed your account. We strongly recommend resetting your password immediately to protect your privacy and healing records.
    </div>
    <div class="btn-container">
      <a href="${accountUrl}" class="btn" target="_blank" rel="noopener noreferrer">
        Go to Savastro
      </a>
    </div>
  `;

  const text = `Namaste ${safeName},

We detected a successful sign-in to your Savastro account:
- Timestamp: ${formattedDate}
- IP Address: ${safeIp}
- Device: ${safeDevice}

If this was you, no action is needed.

If you did NOT initiate this sign-in, please reset your password immediately at:
${accountUrl}

Warm regards,
Savastro Security Team
`;

  return {
    subject: 'New Login to Your Savastro Account',
    html: wrapEmailTemplate({
      title: 'New Login Alert – Savastro',
      preheader: `Sign-in detected on ${formattedDate}`,
      contentHtml
    }),
    text
  };
};

export default createLoginNotificationEmail;
