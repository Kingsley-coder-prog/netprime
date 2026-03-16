"use strict";

const mongoose = require("mongoose");
const slugify = require("slugify");

const castMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    character: { type: String, trim: true },
    avatar: { type: String, default: null },
    order: { type: Number, default: 0 }, // Billing order
  },
  { _id: false },
);

const videoFileSchema = new mongoose.Schema(
  {
    quality: {
      type: String,
      enum: ["240p", "360p", "480p", "720p", "1080p", "4K"],
      required: true,
    },
    s3Key: { type: String, required: true }, // S3 object key for HLS manifest
    size: { type: Number }, // File size in bytes
    duration: { type: Number }, // Duration in seconds
  },
  { _id: false },
);

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    tagline: {
      type: String,
      maxlength: [300, "Tagline cannot exceed 300 characters"],
      default: null,
    },

    // ---- Classification ----
    genres: {
      type: [String],
      required: [true, "At least one genre is required"],
      enum: [
        "Action",
        "Adventure",
        "Animation",
        "Comedy",
        "Crime",
        "Documentary",
        "Drama",
        "Fantasy",
        "Horror",
        "Mystery",
        "Romance",
        "Sci-Fi",
        "Thriller",
        "Western",
        "Biography",
        "Family",
        "History",
        "Music",
        "Sport",
        "War",
      ],
    },
    language: { type: String, default: "English", trim: true },
    country: { type: String, default: null, trim: true },
    releaseYear: { type: Number, required: true },
    duration: { type: Number, required: true }, // Minutes
    ageRating: {
      type: String,
      enum: ["G", "PG", "PG-13", "R", "NC-17", "NR"],
      default: "NR",
    },

    // ---- People ----
    director: { type: String, trim: true, default: null },
    cast: { type: [castMemberSchema], default: [] },

    // ---- Media ----
    posterUrl: { type: String, default: null }, // CDN URL
    backdropUrl: { type: String, default: null }, // Wide banner image
    trailerUrl: { type: String, default: null }, // YouTube or CDN URL
    videoFiles: { type: [videoFileSchema], default: [] }, // HLS manifests per quality

    // ---- Ratings ----
    rating: {
      average: { type: Number, default: 0, min: 0, max: 10 },
      count: { type: Number, default: 0 },
    },
    imdbId: { type: String, default: null, trim: true },
    imdbRating: { type: Number, default: null, min: 0, max: 10 },

    // ---- Status ----
    status: {
      type: String,
      enum: ["draft", "processing", "published", "archived"],
      default: "draft",
      index: true,
    },

    // ---- Access control ----
    isFeatured: { type: Boolean, default: false, index: true },
    isFree: { type: Boolean, default: false }, // Free vs subscription
    requiredPlan: {
      type: String,
      enum: ["free", "basic", "premium"],
      default: "basic",
    },

    // ---- Tracking ----
    viewCount: { type: Number, default: 0 },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    publishedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ---- Indexes ----
movieSchema.index({ title: "text", description: "text", "cast.name": "text" }); // Full-text search
movieSchema.index({ genres: 1 });
movieSchema.index({ releaseYear: -1 });
movieSchema.index({ "rating.average": -1 });
movieSchema.index({ viewCount: -1 });
movieSchema.index({ status: 1, isFeatured: 1 });
movieSchema.index({ createdAt: -1 });

// ---- Virtual: formatted duration ----
movieSchema.virtual("durationFormatted").get(function () {
  const h = Math.floor(this.duration / 60);
  const m = this.duration % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
});

// ---- Pre-save: auto-generate slug ----
movieSchema.pre("save", async function (next) {
  if (!this.isModified("title")) return next();

  let baseSlug = slugify(this.title, { lower: true, strict: true });
  let slug = `${baseSlug}-${this.releaseYear}`;
  let suffix = 1;

  // Ensure uniqueness
  while (
    await mongoose.model("Movie").findOne({ slug, _id: { $ne: this._id } })
  ) {
    slug = `${baseSlug}-${this.releaseYear}-${suffix++}`;
  }

  this.slug = slug;
  next();
});

// ---- Pre-save: set publishedAt when status becomes published ----
movieSchema.pre("save", function (next) {
  if (
    this.isModified("status") &&
    this.status === "published" &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }
  next();
});

const Movie = mongoose.model("Movie", movieSchema);
module.exports = Movie;
