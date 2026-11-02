import { wrapEmailTemplate } from './baseEmailTemplate.js';

export const createWelcomeEmail = ({ name, dashboardUrl }) => {
  const safeName = name ? name.replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'Friend';

  const contentHtml = `
    <h1>Welcome to Your Healing Journey</h1>
    <p>Namaste <b>${safeName}</b>,</p>
    <p>
      Your account is now verified and active. We are honored to accompany you on your path to mindful emotional balance, healing remedies, and astrological insights.
    </p>
    <div class="highlight-box">
      <b style="color: #d0bcff;">What you can do on Savastro:</b>
      <ul style="margin: 10px 0 0; padding-left: 20px; line-height: 1.8;">
        <li><b>Daily Mood Check-ins:</b> Reflect on how you feel every day across 8 nuanced emotional states.</li>
        <li><b>Weekly &amp; Monthly Trends:</b> Discover mood patterns, swings, averages, and reflections.</li>
        <li><b>Astrological Healing Tasks:</b> Practice sacred remedies and mantras guided by experienced practitioners.</li>
        <li><b>Consult Guides:</b> Connect with Vedic astrologers, tarot masters, and meditation guides.</li>
      </ul>
    </div>
    <div class="btn-container">
      <a href="${dashboardUrl}" class="btn" target="_blank" rel="noopener noreferrer">
        Open My Tracker
      </a>
    </div>
    <p style="font-size: 13px; color: #9aa0b6;">
      Remember: Taking a few moments each day to log your feelings is an act of deep self-care.
    </p>
  `;

  const text = `Namaste ${safeName},

Welcome to Savastro – Mood & Healing Tracker! Your account is verified and ready.

What you can do on Savastro:
- Log your daily moods and emotional states
- View weekly & monthly healing trends
- Complete guided healing tasks and chants
- Connect with trusted astrologers and guides

Access your tracker here:
${dashboardUrl}

May your journey bring peace, healing, and clarity.

Warm regards,
Savastro Team
`;

  return {
    subject: 'Welcome to Savastro – Your Healing Journey Begins',
    html: wrapEmailTemplate({
      title: 'Welcome to Savastro',
      preheader: 'Your account is ready. Begin your emotional wellness journey.',
      contentHtml
    }),
    text
  };
};

export default createWelcomeEmail;
