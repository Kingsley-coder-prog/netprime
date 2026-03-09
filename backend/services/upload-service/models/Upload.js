// Mongoose schema
"use strict";

const mongoose = require("mongoose");

const uploadSchema = new mongoose.Schema(
  {
    // ---- Ownership ----
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ---- Linked movie (set after upload completes) ----
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      default: null,
      index: true,
    },

    // ---- Original file info ----
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },

    // ---- S3 raw upload location ----
    s3KeyRaw: {
      type: String,
      required: true,
      // e.g. "raw/2024/01/uuid-filename.mp4"
    },
    s3BucketRaw: {
      type: String,
      required: true,
    },

    // ---- Processing status ----
    status: {
      type: String,
      enum: ["pending", "queued", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },

    // ---- BullMQ job tracking ----
    jobId: {
      type: String,
      default: null,
    },

    // ---- Transcoding progress (0-100) ----
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // ---- Output HLS files (populated by transcoder worker) ----
    outputs: [
      {
        quality: {
          type: String,
          enum: ["360p", "480p", "720p", "1080p", "4K"],
        },
        s3KeyHls: { type: String }, // e.g. "hls/uuid/720p/index.m3u8"
        sizeBytes: { type: Number },
        durationSec: { type: Number },
        _id: false,
      },
    ],

    // ---- Error info (if failed) ----
    errorMessage: {
      type: String,
      default: null,
    },

    // ---- Timestamps ----
    queuedAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  },
);

// ---- Indexes ----
uploadSchema.index({ status: 1, createdAt: -1 });
uploadSchema.index({ uploadedBy: 1, createdAt: -1 });

// ---- Virtual: human-readable file size ----
uploadSchema.virtual("sizeMB").get(function () {
  return (this.sizeBytes / (1024 * 1024)).toFixed(2);
});

const Upload = mongoose.model("Upload", uploadSchema);
module.exports = Upload;
