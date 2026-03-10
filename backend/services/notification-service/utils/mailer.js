"use strict";

const nodemailer = require("nodemailer");
const config = require("../../../config");
const { createServiceLogger } = require("../../../shared/logger");

const logger = createServiceLogger("notification-service:mailer");

let transporter = null;

/**
 * Returns singleton Nodemailer transporter.
 * Uses SMTP config from .env (works with Gmail, SendGrid, Mailgun, etc.)
 */
const getTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });

  return transporter;
};

/**
 * Send an email.
 * @param {object} options
 * @param {string} options.to       - Recipient email address
 * @param {string} options.subject  - Email subject
 * @param {string} options.html     - HTML body
 * @param {string} options.text     - Plain text fallback
 */
const sendEmail = async ({ to, subject, html, text }) => {
  // In test/dev, just log instead of sending
  if (config.isDev && !config.email.user) {
    logger.info(`[DEV] Email to ${to}: ${subject}`);
    return { messageId: "dev-mode" };
  }

  try {
    const info = await getTransporter().sendMail({
      from: config.email.from,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""), // Strip tags as text fallback
    });
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`Failed to send email to ${to}:`, err);
    throw err;
  }
};

module.exports = { sendEmail };
