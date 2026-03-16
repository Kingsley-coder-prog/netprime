"use strict";

const crypto = require("crypto");
const mongoose = require("mongoose");
const WatchSession = require("../models/WatchSession");
const {
  buildStreamManifest,
  generateSignedStreamUrl,
} = require("../utils/cdn");
const { getRedisClient } = require("../../../shared/redis");
const { createServiceLogger } = require("../../../shared/logger");
const {
  NotFoundError,
  AuthorizationError,
  AppError,
} = require("../../../shared/errors");

const logger = createServiceLogger("stream-service");

// ---- Helpers ----

/**
 * Fetch movie from movie-service via internal HTTP.
 * Stream service does NOT import the Movie model directly —
 * services should not share DB connections in a microservice architecture.
 * We call the movie-service API instead.
 */
const fetchMovie = async (movieId) => {
  // Query MongoDB directly — public movie-service endpoint strips videoFiles
  // Stream-service needs videoFiles to build stream URLs
  const Movie =
    mongoose.models.Movie ||
    mongoose.model(
      "Movie",
      new mongoose.Schema({}, { strict: false }),
      "movies",
    );
  const movie = await Movie.findById(movieId).lean();
  if (!movie) throw new NotFoundError("Movie");
  return movie;
};

/**
 * Check if the user's subscription plan allows access to this movie.
 * Plan hierarchy: premium > basic > free
 */
const PLAN_RANK = { free: 0, basic: 1, premium: 2 };

const hasAccess = (userPlan, requiredPlan, isFree) => {
  if (isFree) return true;
  return PLAN_RANK[userPlan] >= PLAN_RANK[requiredPlan];
};

/**
 * Retrieve user subscription info from Redis cache or user-service.
 * Cached for 5 minutes to avoid hitting user-service on every stream request.
 */
const getUserSubscription = async (userId) => {
  const redis = getRedisClient();
  const cacheKey = `user:sub:${userId}`;

  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Call user-service for fresh subscription data
  const axios = require("axios");
  const config = require("../../../config");

  try {
    const res = await axios.get(
      `${config.services.user}/${userId}/subscription`,
      {
        headers: { "x-internal-secret": config.internalSecret },
        timeout: 5000,
      },
    );
    const sub = res.data.data.subscription;
    await redis.set(cacheKey, JSON.stringify(sub), "EX", 300); // Cache 5 min
    return sub;
  } catch {
    // Fallback to free plan if user-service is down — safe default
    logger.warn(
      `Could not fetch subscription for user ${userId}, defaulting to free`,
    );
    return { plan: "free", expiresAt: null };
  }
};

// ============================================================
//  GET STREAM URLS
// ============================================================

/**
 * GET /api/stream/:movieId
 *
 * Returns signed CDN stream URLs for all available qualities.
 * This is the main endpoint the video player calls.
 *
 * Flow:
 *   1. Verify movie exists and is published
 *   2. Check user's subscription against movie's requiredPlan
 *   3. Generate signed CDN URLs (4-hour TTL)
 *   4. Create or update a WatchSession for resume support
 *   5. Return stream manifest to client
 */
const getStreamUrls = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    const { movieId } = req.params;
    const { quality } = req.query;

    // ---- 1. Fetch movie ----
    const movie = await fetchMovie(movieId);

    if (movie.status !== "published") {
      throw new NotFoundError("Movie");
    }

    if (!movie.videoFiles || movie.videoFiles.length === 0) {
      throw new AppError(
        "This movie is not yet available for streaming",
        503,
        "NOT_READY",
      );
    }

    // ---- 2. Subscription check ----
    const subscription = await getUserSubscription(userId);
    if (!hasAccess(subscription.plan, movie.requiredPlan, movie.isFree)) {
      throw new AuthorizationError(
        `This movie requires a ${movie.requiredPlan} plan. Please upgrade your subscription.`,
      );
    }

    // ---- 3. Build stream manifest ----
    let filesToStream = movie.videoFiles;

    // If a specific quality was requested, filter to just that one
    if (quality && quality !== "auto") {
      const match = movie.videoFiles.find((vf) => vf.quality === quality);
      if (!match) {
        throw new AppError(
          `Quality ${quality} is not available. Available: ${movie.videoFiles
            .map((v) => v.quality)
            .join(", ")}`,
          404,
          "QUALITY_NOT_AVAILABLE",
        );
      }
      filesToStream = [match];
    }

    const streams = await buildStreamManifest(filesToStream);

    // ---- 4. Create/update WatchSession ----
    const sessionToken = crypto.randomBytes(16).toString("hex");

    const session = await WatchSession.findOneAndUpdate(
      { userId, movieId },
      {
        $set: {
          sessionToken,
          quality: quality || "auto",
          lastActiveAt: new Date(),
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
        },
        $setOnInsert: {
          progressSeconds: 0,
          durationSeconds: movie.videoFiles[0]?.duration || 0,
        },
      },
      { upsert: true, new: true },
    );

    logger.info(
      `Stream started: userId=${userId} movieId=${movieId} quality=${
        quality || "auto"
      }`,
    );

    res.json({
      success: true,
      data: {
        movieId,
        title: movie.title,
        streams, // Array of { quality, url, duration, expiresAt }
        session: {
          sessionToken,
          progressSeconds: session.progressSeconds, // Resume from here
          percentWatched: session.percentWatched,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
//  SAVE WATCH PROGRESS
// ============================================================

/**
 * POST /api/stream/:movieId/progress
 *
 * Called by the video player every ~10 seconds to save position.
 * Lightweight — just updates Redis immediately, flushes to MongoDB async.
 */
const saveProgress = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    const { movieId } = req.params;
    const { progressSeconds, durationSeconds, quality } = req.body;

    // Write to Redis immediately (fast path)
    const redis = getRedisClient();
    const cacheKey = `progress:${userId}:${movieId}`;
    await redis.set(
      cacheKey,
      JSON.stringify({ progressSeconds, durationSeconds, quality }),
      "EX",
      7 * 24 * 60 * 60, // Keep for 7 days
    );

    // Update MongoDB async (non-blocking, best-effort)
    WatchSession.findOneAndUpdate(
      { userId, movieId },
      {
        $set: {
          progressSeconds,
          durationSeconds,
          quality: quality || "auto",
          lastActiveAt: new Date(),
        },
      },
      { upsert: true },
    )
      .exec()
      .catch((err) => logger.error("Progress flush to DB failed:", err));

    res.json({ success: true, message: "Progress saved" });
  } catch (err) {
    next(err);
  }
};

// ============================================================
//  GET WATCH HISTORY
// ============================================================

/**
 * GET /api/stream/history
 * Returns user's watch history with resume positions.
 */
const getWatchHistory = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      WatchSession.find({ userId })
        .sort({ lastActiveAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WatchSession.countDocuments({ userId }),
    ]);

    res.json({
      success: true,
      data: {
        history: sessions,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/stream/:movieId/progress
 * Returns the user's saved progress for a specific movie (for resume button).
 */
const getProgress = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    const { movieId } = req.params;

    // Check Redis first (faster)
    const redis = getRedisClient();
    const cacheKey = `progress:${userId}:${movieId}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return res.json({ success: true, data: JSON.parse(cached) });
    }

    // Fallback to MongoDB
    const session = await WatchSession.findOne({ userId, movieId }).lean();

    if (!session) {
      return res.json({
        success: true,
        data: { progressSeconds: 0, percentWatched: 0, completed: false },
      });
    }

    res.json({
      success: true,
      data: {
        progressSeconds: session.progressSeconds,
        durationSeconds: session.durationSeconds,
        percentWatched: session.percentWatched,
        completed: session.completed,
        quality: session.quality,
        lastActiveAt: session.lastActiveAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/stream/history/:movieId
 * Remove a movie from watch history.
 */
const removeFromHistory = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    const { movieId } = req.params;

    await WatchSession.deleteOne({ userId, movieId });

    // Also clear Redis cache
    const redis = getRedisClient();
    await redis.del(`progress:${userId}:${movieId}`);

    res.json({ success: true, message: "Removed from watch history" });
  } catch (err) {
    next(err);
  }
};

// ============================================================
//  ADMIN — Stream analytics
// ============================================================

/**
 * GET /api/stream/admin/analytics
 * Returns top movies by watch time and active sessions count.
 */
const getAnalytics = async (req, res, next) => {
  try {
    const topMovies = await WatchSession.aggregate([
      {
        $group: {
          _id: "$movieId",
          totalSessions: { $sum: 1 },
          avgProgress: { $avg: "$percentWatched" },
          completions: { $sum: { $cond: ["$completed", 1, 0] } },
        },
      },
      { $sort: { totalSessions: -1 } },
      { $limit: 20 },
      {
        $project: {
          movieId: "$_id",
          totalSessions: 1,
          avgProgress: { $round: ["$avgProgress", 1] },
          completions: 1,
          completionRate: {
            $round: [
              {
                $multiply: [
                  { $divide: ["$completions", "$totalSessions"] },
                  100,
                ],
              },
              1,
            ],
          },
          _id: 0,
        },
      },
    ]);

    res.json({ success: true, data: { topMovies } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStreamUrls,
  saveProgress,
  getWatchHistory,
  getProgress,
  removeFromHistory,
  getAnalytics,
};
