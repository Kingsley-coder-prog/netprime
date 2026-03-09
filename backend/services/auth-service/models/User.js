// Mongoose schema
"use strict";

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const config = require("../../../../config");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [60, "Name cannot exceed 60 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Never returned in queries by default
    },
    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },
    avatar: {
      type: String,
      default: null,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    refreshTokens: {
      // Store hashed refresh tokens for rotation
      type: [String],
      select: false,
      default: [],
    },
    subscription: {
      plan: {
        type: String,
        enum: ["free", "basic", "premium"],
        default: "free",
      },
      expiresAt: { type: Date, default: null },
    },
    watchHistory: [
      {
        movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie" },
        watchedAt: { type: Date, default: Date.now },
        progress: { type: Number, default: 0 }, // Seconds watched
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true, // Adds createdAt, updatedAt automatically
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// ---- Indexes ----
userSchema.index({ email: 1 });
userSchema.index({ "subscription.plan": 1 });
userSchema.index({ createdAt: -1 });

// ---- Pre-save hook: hash password ----
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, config.bcryptRounds);
  next();
});

// ---- Instance method: compare password ----
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// ---- Instance method: safe public profile ----
userSchema.methods.toPublicProfile = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    avatar: this.avatar,
    isEmailVerified: this.isEmailVerified,
    subscription: this.subscription,
    createdAt: this.createdAt,
  };
};

const User = mongoose.model("User", userSchema);

module.exports = User;
