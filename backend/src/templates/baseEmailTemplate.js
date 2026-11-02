/**
 * Base responsive email template matching the Sovastro brand identity.
 * Palette: Cosmic Dark (#0a0a0f), Card (#12121a), Flame Orange Accents (#f95701, #ff7a1a).
 */
export const wrapEmailTemplate = ({ title, preheader = '', contentHtml }) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0a0a0f;
      font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #f3f4f6;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #0a0a0f;
      padding: 40px 16px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #12121a;
      border: 1px solid #1f2333;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6);
    }
    .header {
      padding: 32px 32px 24px;
      text-align: center;
      border-bottom: 1px solid #1f2333;
      background: linear-gradient(180deg, #181824 0%, #12121a 100%);
    }
    .logo {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 28px;
      font-weight: 700;
      color: #ff7a1a;
      letter-spacing: 0.3px;
      margin: 0;
    }
    .tagline {
      font-size: 13px;
      color: #94a3b8;
      margin-top: 6px;
    }
    .body {
      padding: 36px 32px;
      color: #f3f4f6;
      font-size: 15px;
      line-height: 1.65;
    }
    h1 {
      font-family: 'Playfair Display', Georgia, serif;
      color: #ffffff;
      font-size: 22px;
      font-weight: 600;
      margin: 0 0 18px;
    }
    p {
      margin: 0 0 16px;
      color: #cbd5e1;
    }
    .btn-container {
      text-align: center;
      margin: 28px 0;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(90deg, #ff7a1a 0%, #f95701 100%);
      color: #ffffff !important;
      font-weight: 700;
      font-size: 15px;
      text-decoration: none;
      padding: 14px 34px;
      border-radius: 12px;
      letter-spacing: 0.2px;
      box-shadow: 0 4px 18px rgba(249, 87, 1, 0.4);
    }
    .highlight-box {
      background-color: #0e0e16;
      border: 1px solid #1f2333;
      border-radius: 12px;
      padding: 16px 20px;
      margin: 20px 0;
      font-size: 14px;
      color: #94a3b8;
    }
    .highlight-box b {
      color: #ff7a1a;
    }
    .footer {
      padding: 24px 32px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #1f2333;
      background-color: #0e0e16;
    }
    .footer a {
      color: #94a3b8;
      text-decoration: underline;
    }
    @media only screen and (max-width: 600px) {
      .body { padding: 24px 20px; }
      .header { padding: 24px 20px; }
      .footer { padding: 20px; }
    }
  </style>
</head>
<body>
  <span style="display:none;font-size:0px;line-height:0px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader}
  </span>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1 class="logo">&#10022; Sovastro</h1>
        <div class="tagline">Your mood, your healing journey.</div>
      </div>
      <div class="body">
        ${contentHtml}
      </div>
      <div class="footer">
        <p style="margin: 0 0 6px; font-size: 12px; color: #64748b;">
          Sovastro – Mood &amp; Healing Tracker &bull; Confidential &amp; Secure
        </p>
        <p style="margin: 0; font-size: 11px; color: #475569;">
          This is an automated system email. Please do not reply directly. If you did not initiate this action, please secure your account.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
};
