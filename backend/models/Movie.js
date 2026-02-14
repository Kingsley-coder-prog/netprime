const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  bannerImageUrl: {
    type: String,
    default: null,
  },
  genres: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Genre",
    },
  ],
  year: {
    type: Number,
    required: true,
  },
  rating: {
    type: Number,
    min: 0,
    max: 10,
    default: 0,
  },
  duration: {
    type: Number,
    default: null,
  },
  seasons: {
    type: Number,
    default: null,
  },
  episodes: {
    type: Number,
    default: null,
  },
  director: {
    type: String,
    default: null,
  },
  cast: [
    {
      type: String,
    },
  ],
  contentRating: {
    type: String,
    enum: ["G", "PG", "PG-13", "R", "NC-17", "TV-Y", "TV-Y7", "TV-14", "TV-MA"],
    default: "TV-MA",
  },
  featured: {
    type: Boolean,
    default: false,
  },
  trending: {
    type: Boolean,
    default: false,
  },
  popular: {
    type: Boolean,
    default: false,
  },
  releaseDate: {
    type: Date,
    default: Date.now,
  },
  videoUrl: {
    type: String,
    default: null,
  },
  maturityRating: {
    type: Number,
    default: 18,
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Movie = mongoose.model("Movie", movieSchema);

module.exports = Movie;
