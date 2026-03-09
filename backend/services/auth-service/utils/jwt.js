// Sign / verify tokens
"use strict";

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const config = require("../../../config");

/**
 * Sign an access token (short-lived).
 */
const signAccessToken = (payload) =>
  jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
    issuer: "cinemax",
    audience: "cinemax-client",
  });

/**
 * Sign a refresh token (long-lived, stored hashed in DB).
 */
const signRefreshToken = (payload) =>
  jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
    issuer: "cinemax",
    audience: "cinemax-client",
  });

/**
 * Verify an access token.
 * Throws JsonWebTokenError or TokenExpiredError on failure.
 */
const verifyAccessToken = (token) =>
  jwt.verify(token, config.jwt.accessSecret, {
    issuer: "cinemax",
    audience: "cinemax-client",
  });

/**
 * Verify a refresh token.
 */
const verifyRefreshToken = (token) =>
  jwt.verify(token, config.jwt.refreshSecret, {
    issuer: "cinemax",
    audience: "cinemax-client",
  });

/**
 * Generate a secure random token for email verification / password reset.
 */
const generateSecureToken = () => crypto.randomBytes(32).toString("hex");

/**
 * Hash a token before storing in DB (one-way, compare with timingSafeEqual).
 */
const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

/**
 * Build the standard token pair returned to the client.
 */
const createTokenPair = (user) => {
  const payload = {
    id: user._id.toString(),
    role: user.role,
  };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateSecureToken,
  hashToken,
  createTokenPair,
};
