"use strict";

const { RateLimiterRedis } = require("rate-limiter-flexible");
const { getRedisClient } = require("../redis");
const { RateLimitError } = require("../errors");
const config = require("../../config");

/**
 * Creates an Express middleware that enforces rate limiting via Redis.
 * The Redis client and limiter are created lazily on first request,
 * not at module load time — this prevents silent crashes on startup
 * if Redis is slow to connect.
 */
const createRateLimiter = (options = {}) => {
  const {
    points = config.rateLimit.max,
    duration = Math.floor(config.rateLimit.windowMs / 1000),
    keyPrefix = "rl_global",
  } = options;

  let limiter = null;

  const getLimiter = () => {
    if (!limiter) {
      limiter = new RateLimiterRedis({
        storeClient: getRedisClient(),
        keyPrefix,
        points,
        duration,
        blockDuration: 60,
        execEvenly: false,
        rejectIfRedisNotReady: false,
        // If Redis is down, fail open (don't block requests)
        insuranceLimiter:
          new (require("rate-limiter-flexible").RateLimiterMemory)({
            points,
            duration,
          }),
      });
    }
    return limiter;
  };

  return async (req, res, next) => {
    try {
      const key = req.user ? `user_${req.user.id}` : req.ip;
      const result = await getLimiter().consume(key);
      res.set({
        "X-RateLimit-Limit": points,
        "X-RateLimit-Remaining": result.remainingPoints,
        "X-RateLimit-Reset": new Date(
          Date.now() + result.msBeforeNext,
        ).toISOString(),
      });
      next();
    } catch (rejRes) {
      if (rejRes instanceof Error) {
        // Redis error — fail open, let request through
        return next();
      }
      res.set({
        "Retry-After": Math.ceil(rejRes.msBeforeNext / 1000),
        "X-RateLimit-Limit": points,
        "X-RateLimit-Remaining": 0,
      });
      next(new RateLimitError());
    }
  };
};

const globalLimiter = createRateLimiter({ keyPrefix: "rl_global" });
const authLimiter = createRateLimiter({
  points: config.rateLimit.authMax,
  keyPrefix: "rl_auth",
});
const uploadLimiter = createRateLimiter({
  points: 20,
  duration: 3600,
  keyPrefix: "rl_upload",
});

module.exports = {
  createRateLimiter,
  globalLimiter,
  authLimiter,
  uploadLimiter,
};
