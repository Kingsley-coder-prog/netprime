"use strict";

const express = require("express");
const router = express.Router();
const controller = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/authenticate");
const { authLimiter } = require("../../../shared/redis/rateLimiter");
const {
  validate,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("../validators/auth.validator");

// Apply stricter rate limit to all auth routes
router.use(authLimiter);

// Public routes
router.post("/register", validate(registerSchema), controller.register);
router.post("/login", validate(loginSchema), controller.login);
router.post("/refresh", controller.refreshTokens);
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  controller.forgotPassword,
);
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  controller.resetPassword,
);
router.get("/verify-email/:token", controller.verifyEmail);

// Protected routes (require valid access token)
router.use(authenticate);
router.get("/me", controller.getMe);
router.post("/logout", controller.logout);
router.post("/logout-all", controller.logoutAll);

module.exports = router;
