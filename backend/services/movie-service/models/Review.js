"use strict";

const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [10, "Rating cannot exceed 10"],
    },
    title: {
      type: String,
      maxlength: [100, "Review title cannot exceed 100 characters"],
      default: null,
      trim: true,
    },
    body: {
      type: String,
      maxlength: [2000, "Review body cannot exceed 2000 characters"],
      default: null,
      trim: true,
    },
    likes: { type: Number, default: 0 },
    spoiler: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

// One review per user per movie
reviewSchema.index({ movie: 1, user: 1 }, { unique: true });

// ---- Static: recalculate movie's average rating ----
reviewSchema.statics.updateMovieRating = async function (movieId) {
  const Movie = require("./Movie");
  const stats = await this.aggregate([
    { $match: { movie: new mongoose.Types.ObjectId(movieId) } },
    {
      $group: {
        _id: "$movie",
        avgRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Movie.findByIdAndUpdate(movieId, {
      "rating.average": Math.round(stats[0].avgRating * 10) / 10,
      "rating.count": stats[0].count,
    });
  } else {
    await Movie.findByIdAndUpdate(movieId, {
      "rating.average": 0,
      "rating.count": 0,
    });
  }
};

// Recalculate after save or delete
reviewSchema.post("save", function () {
  this.constructor.updateMovieRating(this.movie);
});
reviewSchema.post("remove", function () {
  this.constructor.updateMovieRating(this.movie);
});

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
