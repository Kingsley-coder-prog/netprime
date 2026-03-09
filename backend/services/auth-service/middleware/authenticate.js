// JWT verify + role authorize
"use strict";

const { verifyAccessToken } = require("../utils/jwt");
const { getRedisClient } = require("../../../shared/redis");
const {
  AuthenticationError,
  AuthorizationError,
} = require("../../../shared/errors");

/**
 * Middleware: verifies JWT access token on every protected request.
 * Attaches decoded payload to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AuthenticationError("No token provided");
    }

    const token = authHeader.split(" ")[1];

    // Check token blacklist (logged-out tokens)
    const redis = getRedisClient();
    const blocked = await redis.get(`blacklist:${token}`);
    if (blocked) throw new AuthenticationError("Token has been invalidated");

    const payload = verifyAccessToken(token);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware factory: restrict access to specific roles.
 * Usage: router.delete('/movie', authenticate, authorize('admin'), handler)
 */
const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return next(new AuthenticationError());
    if (!roles.includes(req.user.role)) {
      return next(new AuthorizationError());
    }
    next();
  };

module.exports = { authenticate, authorize };
