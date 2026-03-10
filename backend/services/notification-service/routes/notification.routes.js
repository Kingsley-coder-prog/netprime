"use strict";

const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/notification.controller");

/**
 * Notification service is internal only — called by other services, not by clients.
 * All routes are protected by a shared internal secret header.
 */
const requireInternalSecret = (req, res, next) => {
  const secret = req.headers["x-internal-secret"];
  if (!secret || secret !== process.env.INTERNAL_SERVICE_SECRET) {
    return res.status(403).json({
      success: false,
      code: "AUTHORIZATION_ERROR",
      message: "Internal service access only",
    });
  }
  next();
};

router.use(requireInternalSecret);

// ---- Email routes ----
router.post("/email/welcome", ctrl.sendWelcomeEmail);
router.post("/email/verify", ctrl.sendVerifyEmail);
router.post("/email/password-reset", ctrl.sendPasswordResetEmail);
router.post("/email/transcode-complete", ctrl.sendTranscodeCompleteEmail);
router.post("/email/transcode-failed", ctrl.sendTranscodeFailedEmail);
router.post("/email/subscription-upgrade", ctrl.sendSubscriptionUpgradeEmail);

module.exports = router;
