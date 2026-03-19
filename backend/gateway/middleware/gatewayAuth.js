"use strict";

const { verifyAccessToken } = require("../../services/auth-service/utils/jwt");
const { getRedisClient } = require("../../shared/redis");
const { AuthenticationError } = require("../../shared/errors");

/**
 * Gateway-level JWT check.
 * Passes decoded user info downstream via X-User-* headers.
 * Services trust these headers (they only receive traffic via gateway).
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AuthenticationError("No token provided");
    }

    const token = authHeader.split(" ")[1];

    // Blacklist check
    const redis = getRedisClient();
    const blocked = await redis.get(`blacklist:${token}`);
    if (blocked) throw new AuthenticationError("Token has been invalidated");

    const payload = verifyAccessToken(token);

    // Forward user context to downstream services via trusted headers
    req.headers["X-User-Id"] = payload.id;
    req.headers["X-User-Role"] = payload.role;
    req.user = payload;

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate };

/**
 * Optional authentication — injects user headers if token present,
 * but does NOT block the request if no token. Used for public routes
 * that have both public and authenticated behaviour (e.g. movies).
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(); // No token — continue as guest
    }

    const token = authHeader.split(" ")[1];

    const redis = getRedisClient();
    const blocked = await redis.get(`blacklist:${token}`);
    if (blocked) return next(); // Blacklisted — treat as guest

    const payload = verifyAccessToken(token);
    req.headers["X-User-Id"] = payload.id;
    req.headers["X-User-Role"] = payload.role;
    req.user = payload;
  } catch {
    // Invalid token — treat as guest, don't block
  }
  next();
};

module.exports = { authenticate, optionalAuthenticate };
