"use strict";

const { sendEmail } = require("../utils/mailer");
const {
  welcomeEmail,
  verifyEmailTemplate,
  passwordResetTemplate,
  transcodeCompleteTemplate,
  transcodeFailedTemplate,
  subscriptionUpgradeTemplate,
} = require("../templates/email.templates");
const { createServiceLogger } = require("../../../shared/logger");
const { ValidationError } = require("../../../shared/errors");

const logger = createServiceLogger("notification-service");

const BASE_URL =
  process.env.CORS_ORIGIN?.split(",")[0] || "http://localhost:5500";

// ============================================================
//  EMAIL DISPATCH HANDLERS
// ============================================================

/**
 * POST /api/notifications/email/welcome
 * Triggered by auth-service after successful registration.
 */
const sendWelcomeEmail = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    if (!email || !name)
      throw new ValidationError("name and email are required");

    const template = welcomeEmail({ name });
    await sendEmail({ to: email, ...template });

    res.json({ success: true, message: "Welcome email sent" });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/notifications/email/verify
 * Sends email verification link.
 */
const sendVerifyEmail = async (req, res, next) => {
  try {
    const { name, email, token } = req.body;
    if (!email || !name || !token)
      throw new ValidationError("name, email, and token are required");

    const verifyUrl = `${BASE_URL}/verify-email?token=${token}`;
    const template = verifyEmailTemplate({ name, verifyUrl });
    await sendEmail({ to: email, ...template });

    res.json({ success: true, message: "Verification email sent" });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/notifications/email/password-reset
 * Sends password reset link.
 */
const sendPasswordResetEmail = async (req, res, next) => {
  try {
    const { name, email, token } = req.body;
    if (!email || !name || !token)
      throw new ValidationError("name, email, and token are required");

    const resetUrl = `${BASE_URL}/reset-password?token=${token}`;
    const template = passwordResetTemplate({ name, resetUrl });
    await sendEmail({ to: email, ...template });

    res.json({ success: true, message: "Password reset email sent" });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/notifications/email/transcode-complete
 * Called by transcoder worker when a movie finishes processing.
 */
const sendTranscodeCompleteEmail = async (req, res, next) => {
  try {
    const { name, email, movieTitle, movieId } = req.body;
    if (!email || !name || !movieTitle)
      throw new ValidationError("name, email, and movieTitle are required");

    const movieUrl = `${BASE_URL}/movie/${movieId}`;
    const template = transcodeCompleteTemplate({ name, movieTitle, movieUrl });
    await sendEmail({ to: email, ...template });

    res.json({ success: true, message: "Transcode complete email sent" });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/notifications/email/transcode-failed
 * Called by transcoder worker on job failure.
 */
const sendTranscodeFailedEmail = async (req, res, next) => {
  try {
    const { name, email, movieTitle, errorMessage } = req.body;
    if (!email || !name || !movieTitle)
      throw new ValidationError("name, email, and movieTitle are required");

    const template = transcodeFailedTemplate({
      name,
      movieTitle,
      errorMessage,
    });
    await sendEmail({ to: email, ...template });

    res.json({ success: true, message: "Transcode failed email sent" });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/notifications/email/subscription-upgrade
 * Triggered by user-service when admin upgrades a user's plan.
 */
const sendSubscriptionUpgradeEmail = async (req, res, next) => {
  try {
    const { name, email, plan, expiresAt } = req.body;
    if (!email || !name || !plan)
      throw new ValidationError("name, email, and plan are required");

    const template = subscriptionUpgradeTemplate({ name, plan, expiresAt });
    await sendEmail({ to: email, ...template });

    res.json({ success: true, message: "Subscription upgrade email sent" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  sendWelcomeEmail,
  sendVerifyEmail,
  sendPasswordResetEmail,
  sendTranscodeCompleteEmail,
  sendTranscodeFailedEmail,
  sendSubscriptionUpgradeEmail,
};
