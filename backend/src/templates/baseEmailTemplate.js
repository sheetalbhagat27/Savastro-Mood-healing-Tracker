/**
 * Base responsive email template matching the Savastro brand identity.
 * Palette: Deep Navy (#0f131d), Card (#181c26), Purple Accents (#7c4dff, #d0bcff), Text (#e6e8f4).
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
      background-color: #0f131d;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e6e8f4;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #0f131d;
      padding: 40px 16px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #181c26;
      border: 1px solid #2b303c;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    }
    .header {
      padding: 32px 32px 24px;
      text-align: center;
      border-bottom: 1px solid #2b303c;
      background: linear-gradient(180deg, #1f2533 0%, #181c26 100%);
    }
    .logo {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 28px;
      font-weight: 700;
      color: #d0bcff;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .tagline {
      font-size: 13px;
      color: #9aa0b6;
      margin-top: 6px;
    }
    .body {
      padding: 36px 32px;
      color: #e6e8f4;
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
      color: #c9ccd8;
    }
    .btn-container {
      text-align: center;
      margin: 28px 0;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #7c4dff 0%, #d0bcff 100%);
      color: #0f131d !important;
      font-weight: 700;
      font-size: 15px;
      text-decoration: none;
      padding: 14px 34px;
      border-radius: 12px;
      letter-spacing: 0.2px;
      box-shadow: 0 4px 14px rgba(124, 77, 255, 0.35);
    }
    .highlight-box {
      background-color: #12161f;
      border: 1px solid #2b303c;
      border-radius: 12px;
      padding: 16px 20px;
      margin: 20px 0;
      font-size: 14px;
      color: #9aa0b6;
    }
    .highlight-box b {
      color: #4cd7f6;
    }
    .footer {
      padding: 24px 32px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #2b303c;
      background-color: #141720;
    }
    .footer a {
      color: #9aa0b6;
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
        <h1 class="logo">Savastro</h1>
        <div class="tagline">Your mood, your healing journey.</div>
      </div>
      <div class="body">
        ${contentHtml}
      </div>
      <div class="footer">
        <p style="margin: 0 0 6px; font-size: 12px; color: #6b7280;">
          Savastro – Mood &amp; Healing Tracker &bull; Confidential &amp; Secure
        </p>
        <p style="margin: 0; font-size: 11px; color: #525866;">
          This is an automated system email. Please do not reply directly. If you did not initiate this action, please secure your account.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
};
