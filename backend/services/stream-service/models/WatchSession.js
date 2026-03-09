// Mongoose schema
"use strict";

const mongoose = require("mongoose");

/**
 * WatchSession tracks every time a user starts watching a movie.
 * Used for:
 *  - Resume playback (progress in seconds)
 *  - Analytics (most watched, watch time)
 *  - DRM enforcement (one active session per account on free plan)
 */
const watchSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
      index: true,
    },

    // ---- Playback state ----
    progressSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    // Percentage watched (0-100), computed before save
    percentWatched: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completed: {
      type: Boolean,
      default: false,
    },

    // ---- Quality last played ----
    quality: {
      type: String,
      enum: ["360p", "480p", "720p", "1080p", "4K", "auto"],
      default: "auto",
    },

    // ---- Session token (used to invalidate concurrent streams) ----
    sessionToken: {
      type: String,
      required: true,
    },

    // ---- Device info ----
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },

    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// One active session doc per user+movie (upsert on play)
watchSessionSchema.index({ userId: 1, movieId: 1 }, { unique: true });
watchSessionSchema.index(
  { lastActiveAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 },
); // TTL: 30 days

// Auto-compute percentWatched before save
watchSessionSchema.pre("save", function (next) {
  if (this.durationSeconds > 0) {
    this.percentWatched = Math.min(
      100,
      Math.round((this.progressSeconds / this.durationSeconds) * 100),
    );
    this.completed = this.percentWatched >= 90; // 90%+ = completed
  }
  next();
});

const WatchSession = mongoose.model("WatchSession", watchSessionSchema);
module.exports = WatchSession;
