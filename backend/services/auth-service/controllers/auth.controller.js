"use strict";

const crypto = require("crypto");
const axios = require("axios");
const User = require("../models/User");
const {
  createTokenPair,
  verifyRefreshToken,
  hashToken,
  generateSecureToken,
} = require("../utils/jwt");
const { getRedisClient } = require("../../../shared/redis");
const { createServiceLogger } = require("../../../shared/logger");
const {
  ConflictError,
  AuthenticationError,
  NotFoundError,
  ValidationError,
} = require("../../../shared/errors");

const logger = createServiceLogger("auth-service");

// ---- Helpers ----

/**
 * Set refresh token as httpOnly cookie + return access token in body.
 * This pattern prevents XSS from stealing the refresh token.
 */
const sendTokenResponse = (res, user, tokens, statusCode = 200) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("refreshToken", tokens.refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/api/auth/refresh", // Only sent to refresh endpoint
  });

  return res.status(statusCode).json({
    success: true,
    data: {
      accessToken: tokens.accessToken,
      user: user.toPublicProfile(),
    },
  });
};

// ---- Controller methods ----

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing)
      throw new ConflictError("An account with this email already exists");

    const user = await User.create({ name, email, password });

    // TODO: send verification email via notification-service
    const verifyToken = generateSecureToken();
    user.emailVerificationToken = hashToken(verifyToken);
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    logger.info(`New user registered: ${email}`);

    // Provision user profile in user-service (fire and forget)
    axios
      .post(`${process.env.USER_SERVICE_URL}/provision`, {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      })
      .catch((err) =>
        logger.error("Failed to provision user profile:", err.message),
      );

    const tokens = createTokenPair(user);

    // Store hashed refresh token
    user.refreshTokens.push(hashToken(tokens.refreshToken));
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(res, user, tokens, 201);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Must select password explicitly (it's select:false on schema)
    const user = await User.findOne({ email }).select(
      "+password +refreshTokens",
    );

    if (!user || !(await user.comparePassword(password))) {
      // Same error message for both cases - prevents user enumeration
      throw new AuthenticationError("Invalid email or password");
    }

    if (!user.isActive) {
      throw new AuthenticationError(
        "Your account has been deactivated. Contact support.",
      );
    }

    user.lastLogin = new Date();
    const tokens = createTokenPair(user);

    // Rotate: keep max 5 refresh tokens (multi-device support)
    user.refreshTokens.push(hashToken(tokens.refreshToken));
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }
    await user.save({ validateBeforeSave: false });

    logger.info(`User logged in: ${email}`);
    sendTokenResponse(res, user, tokens);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/refresh
 * Client sends refresh token (from httpOnly cookie OR body as fallback).
 */
const refreshTokens = async (req, res, next) => {
  try {
    const incomingToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingToken)
      throw new AuthenticationError("No refresh token provided");

    const payload = verifyRefreshToken(incomingToken);
    const hashedIncoming = hashToken(incomingToken);

    const user = await User.findById(payload.id).select("+refreshTokens");
    if (!user) throw new AuthenticationError("User not found");

    // Check token is in DB (rotation detection)
    const tokenIndex = user.refreshTokens.indexOf(hashedIncoming);
    if (tokenIndex === -1) {
      // Potential token reuse attack - invalidate ALL tokens
      user.refreshTokens = [];
      await user.save({ validateBeforeSave: false });
      logger.warn(`Refresh token reuse detected for user ${user._id}`);
      throw new AuthenticationError(
        "Session has been invalidated. Please log in again.",
      );
    }

    const tokens = createTokenPair(user);

    // Replace old token with new (rotation)
    user.refreshTokens[tokenIndex] = hashToken(tokens.refreshToken);
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(res, user, tokens);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    const incomingToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (incomingToken && req.user) {
      const hashed = hashToken(incomingToken);
      await User.findByIdAndUpdate(req.user.id, {
        $pull: { refreshTokens: hashed },
      });

      // Blacklist the access token in Redis until it expires
      const redis = getRedisClient();
      const key = `blacklist:${req.headers.authorization?.split(" ")[1]}`;
      await redis.set(key, "1", "EX", 15 * 60); // Match access token TTL
    }

    res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout-all
 * Logs out from all devices.
 */
const logoutAll = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { refreshTokens: [] });
    res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
    res.json({ success: true, message: "Logged out from all devices" });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always respond the same way to prevent email enumeration
    const successResponse = {
      success: true,
      message:
        "If an account exists with this email, a reset link has been sent.",
    };

    if (!user) return res.json(successResponse);

    const resetToken = generateSecureToken();
    user.passwordResetToken = hashToken(resetToken);
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    // TODO: emit event to notification-service to send email
    // The raw resetToken goes in the email link, NOT the hashed one
    logger.info(
      `Password reset requested for: ${email} | Token: ${resetToken}`,
    );

    res.json(successResponse);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const hashedToken = hashToken(token);

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+refreshTokens");

    if (!user)
      throw new ValidationError(
        "Password reset token is invalid or has expired",
      );

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshTokens = []; // Invalidate all sessions
    await user.save();

    logger.info(`Password reset successful for user ${user._id}`);
    res.json({
      success: true,
      message: "Password has been reset. Please log in.",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Returns the authenticated user's profile.
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) throw new NotFoundError("User");
    res.json({ success: true, data: { user: user.toPublicProfile() } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/verify-email/:token
 */
const verifyEmail = async (req, res, next) => {
  try {
    const hashedToken = hashToken(req.params.token);
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    }).select("+emailVerificationToken +emailVerificationExpires");

    if (!user)
      throw new ValidationError(
        "Email verification token is invalid or has expired",
      );

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: "Email verified successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  refreshTokens,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  getMe,
  verifyEmail,
};
