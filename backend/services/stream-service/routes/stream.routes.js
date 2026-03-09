"use strict";

const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/stream.controller");
const {
  validate,
  streamRequestSchema,
  progressUpdateSchema,
} = require("../validators/stream.validator");
const { createRateLimiter } = require("../../../shared/redis/rateLimiter");

// Slightly stricter rate limit for stream URL generation
// (prevents URL farming — generating URLs without watching)
const streamLimiter = createRateLimiter({
  points: 60,
  duration: 60, // 60 requests per minute per user
  keyPrefix: "rl_stream",
});

// Auth check — all stream routes require a user
const requireAuth = (req, res, next) => {
  if (!req.headers["x-user-id"]) {
    return res.status(401).json({
      success: false,
      code: "AUTHENTICATION_ERROR",
      message: "Authentication required",
    });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.headers["x-user-role"] !== "admin") {
    return res.status(403).json({
      success: false,
      code: "AUTHORIZATION_ERROR",
      message: "Admin access required",
    });
  }
  next();
};

router.use(requireAuth);

// ---- Admin routes (must come before :movieId to avoid route conflict) ----
router.get("/admin/analytics", requireAdmin, ctrl.getAnalytics);

// ---- Watch history ----
router.get("/history", ctrl.getWatchHistory);
router.delete("/history/:movieId", ctrl.removeFromHistory);

// ---- Core streaming ----
router.get(
  "/:movieId",
  streamLimiter,
  validate(streamRequestSchema),
  ctrl.getStreamUrls,
);

// ---- Progress tracking ----
router.get("/:movieId/progress", ctrl.getProgress);
router.post(
  "/:movieId/progress",
  validate(progressUpdateSchema),
  ctrl.saveProgress,
);

module.exports = router;
