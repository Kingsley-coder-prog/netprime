"use strict";

const mongoose = require("mongoose");
const UserProfile = require("../models/UserProfile");
const { getRedisClient } = require("../../../shared/redis");
const { createServiceLogger } = require("../../../shared/logger");
const {
  NotFoundError,
  AuthorizationError,
  ConflictError,
} = require("../../../shared/errors");

const logger = createServiceLogger("user-service");

// ---- Cache helpers ----
const invalidateUserCache = async (userId) => {
  try {
    const redis = getRedisClient();
    await redis.del(`user:profile:${userId}`, `user:sub:${userId}`);
  } catch {
    /* non-fatal */
  }
};

// ---- Ownership guard ----
const assertOwnerOrAdmin = (requestingUserId, targetUserId, role) => {
  if (role !== "admin" && requestingUserId !== targetUserId) {
    throw new AuthorizationError("You can only access your own profile");
  }
};

// ============================================================
//  PROFILE
// ============================================================

/**
 * GET /api/users/me
 * Returns the authenticated user's own profile.
 */
const getMyProfile = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];

    // Check Redis cache first
    const redis = getRedisClient();
    const cacheKey = `user:profile:${userId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: { user: JSON.parse(cached) } });
    }

    const user = await UserProfile.findById(userId).lean();
    if (!user) throw new NotFoundError("User profile");

    await redis.set(cacheKey, JSON.stringify(user), "EX", 300); // 5 min cache
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/:userId
 * Public-ish — returns limited profile info. Full info for self/admin.
 */
const getProfile = async (req, res, next) => {
  try {
    const requestingUserId = req.headers["x-user-id"];
    const requestingRole = req.headers["x-user-role"];
    const { userId } = req.params;

    const isSelf = requestingUserId === userId;
    const isAdmin = requestingRole === "admin";

    const user = await UserProfile.findById(userId).lean();
    if (!user || !user.isActive) throw new NotFoundError("User");

    // Non-self, non-admin: return limited public profile
    if (!isSelf && !isAdmin) {
      return res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            avatar: user.avatar,
            bio: user.bio,
          },
        },
      });
    }

    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/me
 * Update own profile fields.
 */
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];

    const user = await UserProfile.findByIdAndUpdate(
      userId,
      { $set: req.body },
      { new: true, runValidators: true },
    );
    if (!user) throw new NotFoundError("User profile");

    await invalidateUserCache(userId);
    logger.info(`Profile updated: userId=${userId}`);

    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/me/preferences
 * Update notification, quality, and genre preferences.
 */
const updatePreferences = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];

    // Build dot-notation update to avoid overwriting entire preferences object
    const updates = {};
    const { preferredGenres, preferredQuality, autoplay, notifications } =
      req.body;
    if (preferredGenres !== undefined)
      updates["preferences.preferredGenres"] = preferredGenres;
    if (preferredQuality !== undefined)
      updates["preferences.preferredQuality"] = preferredQuality;
    if (autoplay !== undefined) updates["preferences.autoplay"] = autoplay;
    if (notifications?.email !== undefined)
      updates["preferences.notifications.email"] = notifications.email;
    if (notifications?.push !== undefined)
      updates["preferences.notifications.push"] = notifications.push;

    const user = await UserProfile.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true },
    );
    if (!user) throw new NotFoundError("User profile");

    await invalidateUserCache(userId);
    res.json({ success: true, data: { preferences: user.preferences } });
  } catch (err) {
    next(err);
  }
};

// ============================================================
//  WATCHLIST
// ============================================================

/**
 * GET /api/users/me/watchlist
 */
const getWatchlist = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);

    const user = await UserProfile.findById(userId).select("watchlist").lean();
    if (!user) throw new NotFoundError("User profile");

    const total = user.watchlist.length;
    const paginated = user.watchlist
      .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
      .slice((page - 1) * limit, page * limit);

    res.json({
      success: true,
      data: {
        watchlist: paginated,
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
 * POST /api/users/me/watchlist
 * Add a movie to the watchlist.
 */
const addToWatchlist = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    const { movieId } = req.body;

    const movieObjId = new mongoose.Types.ObjectId(movieId);

    // Check if already in watchlist
    const user = await UserProfile.findById(userId).select("watchlist");
    if (!user) throw new NotFoundError("User profile");

    const alreadyAdded = user.watchlist.some(
      (w) => w.movieId.toString() === movieId,
    );
    if (alreadyAdded)
      throw new ConflictError("Movie is already in your watchlist");

    user.watchlist.push({ movieId: movieObjId, addedAt: new Date() });
    await user.save();

    res.status(201).json({ success: true, message: "Added to watchlist" });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/users/me/watchlist/:movieId
 * Remove a movie from the watchlist.
 */
const removeFromWatchlist = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    const { movieId } = req.params;

    const result = await UserProfile.findByIdAndUpdate(
      userId,
      {
        $pull: { watchlist: { movieId: new mongoose.Types.ObjectId(movieId) } },
      },
      { new: true },
    );
    if (!result) throw new NotFoundError("User profile");

    res.json({ success: true, message: "Removed from watchlist" });
  } catch (err) {
    next(err);
  }
};

// ============================================================
//  SUBSCRIPTION
// ============================================================

/**
 * GET /api/users/:userId/subscription
 * Used internally by stream-service to check access.
 */
const getSubscription = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await UserProfile.findById(userId)
      .select("subscription")
      .lean();
    if (!user) throw new NotFoundError("User profile");

    res.json({ success: true, data: { subscription: user.subscription } });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/:userId/subscription
 * Admin only — upgrades or downgrades a user's plan.
 */
const updateSubscription = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { plan, expiresAt, autoRenew } = req.body;

    const user = await UserProfile.findByIdAndUpdate(
      userId,
      {
        $set: {
          "subscription.plan": plan,
          "subscription.expiresAt": expiresAt || null,
          "subscription.autoRenew": autoRenew ?? false,
          "subscription.startedAt": new Date(),
        },
      },
      { new: true },
    );
    if (!user) throw new NotFoundError("User profile");

    await invalidateUserCache(userId);
    logger.info(`Subscription updated: userId=${userId} plan=${plan}`);

    res.json({ success: true, data: { subscription: user.subscription } });
  } catch (err) {
    next(err);
  }
};

// ============================================================
//  ADMIN
// ============================================================

/**
 * GET /api/users
 * Admin only — list all users with pagination and filtering.
 */
const getAllUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const search = req.query.search;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
      ];
    }
    if (req.query.plan) filter["subscription.plan"] = req.query.plan;
    if (req.query.role) filter.role = req.query.role;

    const [users, total] = await Promise.all([
      UserProfile.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-watchlist -preferences")
        .lean(),
      UserProfile.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/:userId/status
 * Admin only — activate or deactivate a user account.
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await UserProfile.findByIdAndUpdate(
      userId,
      { $set: { isActive } },
      { new: true },
    );
    if (!user) throw new NotFoundError("User");

    await invalidateUserCache(userId);
    logger.info(`User ${userId} status set to isActive=${isActive}`);

    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/users/provision
 * Internal endpoint called by auth-service after a user registers.
 * Creates the UserProfile document mirroring the new User.
 */
const provisionUser = async (req, res, next) => {
  try {
    const { userId, name, email, role } = req.body;

    // Idempotent — don't fail if profile already exists
    const existing = await UserProfile.findById(userId);
    if (existing) {
      return res.json({ success: true, data: { user: existing } });
    }

    const user = await UserProfile.create({ _id: userId, name, email, role });
    logger.info(`UserProfile provisioned: userId=${userId}`);

    res.status(201).json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyProfile,
  getProfile,
  updateProfile,
  updatePreferences,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  getSubscription,
  updateSubscription,
  getAllUsers,
  updateUserStatus,
  provisionUser,
};
