// Verifies JWT before forwarding requests
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
