// Mongoose schema
"use strict";

const mongoose = require("mongoose");

/**
 * UserProfile is a separate collection from auth-service's User model.
 * Auth-service owns credentials/tokens.
 * User-service owns profile data, watchlists, and subscription details.
 *
 * They share the same _id (MongoDB ObjectId from auth-service).
 * This keeps auth lean and lets user-service scale independently.
 */
const userProfileSchema = new mongoose.Schema(
  {
    // Same _id as auth-service User document
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: 300,
      default: null,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    country: {
      type: String,
      default: null,
      trim: true,
    },
    language: {
      type: String,
      default: "en",
    },

    // ---- Subscription ----
    subscription: {
      plan: {
        type: String,
        enum: ["free", "basic", "premium"],
        default: "free",
      },
      startedAt: { type: Date, default: null },
      expiresAt: { type: Date, default: null },
      autoRenew: { type: Boolean, default: false },
    },

    // ---- Watchlist (saved movies) ----
    watchlist: [
      {
        movieId: { type: mongoose.Schema.Types.ObjectId, required: true },
        addedAt: { type: Date, default: Date.now },
        _id: false,
      },
    ],

    // ---- Preferences ----
    preferences: {
      preferredGenres: { type: [String], default: [] },
      preferredQuality: {
        type: String,
        enum: ["360p", "480p", "720p", "1080p", "4K", "auto"],
        default: "auto",
      },
      autoplay: { type: Boolean, default: true },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
      },
    },

    // ---- Account state ----
    isActive: { type: Boolean, default: true },
    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },
  },
  {
    timestamps: true,
    // _id is provided externally, don't auto-generate
    _id: false,
    toJSON: { virtuals: true },
  },
);

// ---- Indexes ----
// userProfileSchema.index({ email: 1 });
userProfileSchema.index({ "subscription.plan": 1 });
userProfileSchema.index({ "subscription.expiresAt": 1 });
userProfileSchema.index({ createdAt: -1 });

// ---- Virtual: subscription is active ----
userProfileSchema.virtual("isSubscriptionActive").get(function () {
  if (this.subscription.plan === "free") return true;
  if (!this.subscription.expiresAt) return false;
  return new Date(this.subscription.expiresAt) > new Date();
});

// ---- Virtual: watchlist count ----
userProfileSchema.virtual("watchlistCount").get(function () {
  return this.watchlist.length;
});

const UserProfile = mongoose.model("UserProfile", userProfileSchema);
module.exports = UserProfile;
