// Rate limiter middleware (uses Redis)
"use strict";

const { RateLimiterRedis } = require("rate-limiter-flexible");
const { getRedisClient } = require("../redis");
const { RateLimitError } = require("../errors");
const config = require("../../config");

/**
 * Creates an Express middleware that enforces rate limiting via Redis.
 *
 * @param {object} options
 * @param {number} options.points   - Max requests per window (default: from config)
 * @param {number} options.duration - Window in seconds (default: 15 min)
 * @param {string} options.keyPrefix - Unique prefix per route group
 */
const createRateLimiter = (options = {}) => {
  const {
    points = config.rateLimit.max,
    duration = Math.floor(config.rateLimit.windowMs / 1000),
    keyPrefix = "rl_global",
  } = options;

  const limiter = new RateLimiterRedis({
    storeClient: getRedisClient(),
    keyPrefix,
    points,
    duration,
    blockDuration: 60, // Block for 1 min after limit hit
  });

  return async (req, res, next) => {
    // Key = IP (for public routes) or userId (for authenticated routes)
    const key = req.user ? `user_${req.user.id}` : req.ip;

    try {
      const result = await limiter.consume(key);
      // Expose rate limit info in headers (good practice)
      res.set({
        "X-RateLimit-Limit": points,
        "X-RateLimit-Remaining": result.remainingPoints,
        "X-RateLimit-Reset": new Date(
          Date.now() + result.msBeforeNext,
        ).toISOString(),
      });
      next();
    } catch (rejRes) {
      res.set({
        "Retry-After": Math.ceil(rejRes.msBeforeNext / 1000),
        "X-RateLimit-Limit": points,
        "X-RateLimit-Remaining": 0,
      });
      next(new RateLimitError());
    }
  };
};

// Pre-built limiters for common use cases
const globalLimiter = createRateLimiter({
  keyPrefix: "rl_global",
});

const authLimiter = createRateLimiter({
  points: config.rateLimit.authMax, // e.g. 10 per 15 min
  keyPrefix: "rl_auth",
});

const uploadLimiter = createRateLimiter({
  points: 20,
  duration: 3600, // 20 uploads per hour
  keyPrefix: "rl_upload",
});

module.exports = {
  createRateLimiter,
  globalLimiter,
  authLimiter,
  uploadLimiter,
};
