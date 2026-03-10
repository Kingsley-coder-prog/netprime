"use strict";

/**
 * All email templates in one file.
 * Each function returns { subject, html } ready to pass to sendEmail().
 * Using inline styles for maximum email client compatibility.
 */

const BASE_URL =
  process.env.CORS_ORIGIN?.split(",")[0] || "http://localhost:5500";

const baseLayout = (content) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:12px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#e94560;padding:30px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;letter-spacing:2px;">🎬 CINEMAX</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 30px;color:#e0e0e0;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0f0f1a;padding:20px;text-align:center;">
              <p style="margin:0;color:#666;font-size:12px;">
                © ${new Date().getFullYear()} Cinemax. All rights reserved.<br>
                <a href="${BASE_URL}" style="color:#e94560;">Visit Cinemax</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const button = (href, text) => `
  <div style="text-align:center;margin:30px 0;">
    <a href="${href}"
       style="background:#e94560;color:#fff;padding:14px 32px;border-radius:6px;
              text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;">
      ${text}
    </a>
  </div>`;

// ---- Templates ----

const welcomeEmail = ({ name }) => ({
  subject: "Welcome to Cinemax 🎬",
  html: baseLayout(`
    <h2 style="color:#e94560;margin-top:0;">Welcome, ${name}!</h2>
    <p>Your Cinemax account is ready. Start exploring thousands of movies.</p>
    ${button(`${BASE_URL}`, "Start Watching")}
    <p style="color:#aaa;font-size:14px;">
      You're currently on the <strong style="color:#fff;">Free plan</strong>.
      Upgrade to Basic or Premium to unlock all movies.
    </p>
  `),
});

const verifyEmailTemplate = ({ name, verifyUrl }) => ({
  subject: "Verify your Cinemax email",
  html: baseLayout(`
    <h2 style="color:#e94560;margin-top:0;">Verify your email</h2>
    <p>Hi ${name}, please verify your email address to unlock full account features.</p>
    <p style="color:#aaa;">This link expires in <strong style="color:#fff;">24 hours</strong>.</p>
    ${button(verifyUrl, "Verify Email")}
    <p style="color:#666;font-size:12px;">
      If you didn't create a Cinemax account, you can safely ignore this email.
    </p>
  `),
});

const passwordResetTemplate = ({ name, resetUrl }) => ({
  subject: "Reset your Cinemax password",
  html: baseLayout(`
    <h2 style="color:#e94560;margin-top:0;">Password Reset</h2>
    <p>Hi ${name}, we received a request to reset your password.</p>
    <p style="color:#aaa;">This link expires in <strong style="color:#fff;">1 hour</strong>.</p>
    ${button(resetUrl, "Reset Password")}
    <p style="color:#666;font-size:12px;">
      If you didn't request this, you can safely ignore this email.
      Your password will not change.
    </p>
  `),
});

const transcodeCompleteTemplate = ({ name, movieTitle, movieUrl }) => ({
  subject: `"${movieTitle}" is ready to stream on Cinemax`,
  html: baseLayout(`
    <h2 style="color:#e94560;margin-top:0;">Your movie is ready! 🎉</h2>
    <p>Hi ${name}, <strong style="color:#fff;">${movieTitle}</strong> has finished processing
    and is now available to stream in multiple qualities.</p>
    ${button(movieUrl, "Watch Now")}
  `),
});

const transcodeFailedTemplate = ({ name, movieTitle, errorMessage }) => ({
  subject: `Processing failed for "${movieTitle}"`,
  html: baseLayout(`
    <h2 style="color:#e94560;margin-top:0;">Processing Failed</h2>
    <p>Hi ${name}, unfortunately we encountered an error while processing
    <strong style="color:#fff;">${movieTitle}</strong>.</p>
    <p style="background:#2a0a0a;border-left:3px solid #e94560;padding:12px;border-radius:4px;
              color:#ff6b6b;font-size:14px;">${
                errorMessage || "Unknown error"
              }</p>
    <p>Please try uploading the file again. If the issue persists, contact support.</p>
    ${button(`${BASE_URL}`, "Go to Dashboard")}
  `),
});

const subscriptionUpgradeTemplate = ({ name, plan, expiresAt }) => ({
  subject: `Your Cinemax ${plan} plan is active`,
  html: baseLayout(`
    <h2 style="color:#e94560;margin-top:0;">Subscription Activated 🎬</h2>
    <p>Hi ${name}, your <strong style="color:#fff;">${plan.toUpperCase()}</strong> plan is now active.</p>
    ${
      expiresAt
        ? `<p style="color:#aaa;">Valid until: <strong style="color:#fff;">${new Date(
            expiresAt,
          ).toDateString()}</strong></p>`
        : ""
    }
    ${button(`${BASE_URL}`, "Start Watching")}
  `),
});

module.exports = {
  welcomeEmail,
  verifyEmailTemplate,
  passwordResetTemplate,
  transcodeCompleteTemplate,
  transcodeFailedTemplate,
  subscriptionUpgradeTemplate,
};
