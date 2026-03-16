"use strict";

const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/user.controller");
const {
  validate,
  updateProfileSchema,
  updatePreferencesSchema,
  updateSubscriptionSchema,
  addToWatchlistSchema,
} = require("../validators/user.validator");
const { globalLimiter } = require("../../../shared/redis/rateLimiter");

router.use(globalLimiter);

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

const requireInternalSecret = (req, res, next) => {
  if (
    req.headers["x-internal-secret"] !== process.env.INTERNAL_SERVICE_SECRET
  ) {
    return res.status(403).json({
      success: false,
      code: "AUTHORIZATION_ERROR",
      message: "Internal service access only",
    });
  }
  next();
};

// ---- Internal endpoint (called by auth-service, no gateway JWT check needed) ----
router.post("/provision", ctrl.provisionUser);

// ---- Internal: subscription check (called by stream-service) ----
router.get(
  "/:userId/subscription",
  requireInternalSecret,
  ctrl.getSubscription,
);

// All routes below require auth
router.use(requireAuth);

// ---- Own profile ----
router.get("/me", ctrl.getMyProfile);
router.patch("/me", validate(updateProfileSchema), ctrl.updateProfile);
router.patch(
  "/me/preferences",
  validate(updatePreferencesSchema),
  ctrl.updatePreferences,
);

// ---- Watchlist ----
router.get("/me/watchlist", ctrl.getWatchlist);
router.post(
  "/me/watchlist",
  validate(addToWatchlistSchema),
  ctrl.addToWatchlist,
);
router.delete("/me/watchlist/:movieId", ctrl.removeFromWatchlist);

// ---- Subscription (admin update only) ----
router.patch(
  "/:userId/subscription",
  requireAdmin,
  validate(updateSubscriptionSchema),
  ctrl.updateSubscription,
);

// ---- Admin ----
router.get("/", requireAdmin, ctrl.getAllUsers);
router.patch("/:userId/status", requireAdmin, ctrl.updateUserStatus);

// ---- Public profile (must come after specific routes) ----
router.get("/:userId", ctrl.getProfile);

module.exports = router;
