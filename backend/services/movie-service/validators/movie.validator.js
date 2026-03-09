// Joi schemas
"use strict";

const Joi = require("joi");

const VALID_GENRES = [
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
];

const VALID_AGE_RATINGS = ["G", "PG", "PG-13", "R", "NC-17", "NR"];
const VALID_STATUSES = ["draft", "processing", "published", "archived"];
const VALID_PLANS = ["free", "basic", "premium"];

// ---- Movie schemas ----

const createMovieSchema = Joi.object({
  title: Joi.string().min(1).max(200).trim().required(),
  description: Joi.string().min(10).max(2000).required(),
  tagline: Joi.string().max(300).allow("", null),
  genres: Joi.array()
    .items(Joi.string().valid(...VALID_GENRES))
    .min(1)
    .required(),
  language: Joi.string().max(50).default("English"),
  country: Joi.string().max(100).allow("", null),
  releaseYear: Joi.number()
    .integer()
    .min(1888)
    .max(new Date().getFullYear() + 2)
    .required(),
  duration: Joi.number().integer().min(1).required(), // Minutes
  ageRating: Joi.string()
    .valid(...VALID_AGE_RATINGS)
    .default("NR"),
  director: Joi.string().max(100).allow("", null),
  cast: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        character: Joi.string().allow("", null),
        avatar: Joi.string().uri().allow("", null),
        order: Joi.number().integer().min(0).default(0),
      }),
    )
    .default([]),
  posterUrl: Joi.string().uri().allow("", null),
  backdropUrl: Joi.string().uri().allow("", null),
  trailerUrl: Joi.string().uri().allow("", null),
  imdbId: Joi.string()
    .pattern(/^tt\d{7,8}$/)
    .allow("", null)
    .messages({ "string.pattern.base": "IMDb ID must be in format tt1234567" }),
  imdbRating: Joi.number().min(0).max(10).allow(null),
  isFree: Joi.boolean().default(false),
  requiredPlan: Joi.string()
    .valid(...VALID_PLANS)
    .default("basic"),
});

const updateMovieSchema = createMovieSchema.fork(
  ["title", "description", "genres", "releaseYear", "duration"],
  (field) => field.optional(),
);

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...VALID_STATUSES)
    .required(),
});

// ---- Review schemas ----

const createReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(10).required(),
  title: Joi.string().max(100).allow("", null),
  body: Joi.string().max(2000).allow("", null),
  spoiler: Joi.boolean().default(false),
});

const updateReviewSchema = createReviewSchema.fork(["rating"], (field) =>
  field.optional(),
);

// ---- Query schemas (for filtering / pagination) ----

const movieQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  sort: Joi.string()
    .valid("newest", "oldest", "rating", "popular", "title")
    .default("newest"),
  genre: Joi.string().valid(...VALID_GENRES),
  year: Joi.number().integer().min(1888).max(2100),
  language: Joi.string().max(50),
  ageRating: Joi.string().valid(...VALID_AGE_RATINGS),
  search: Joi.string().max(200).trim(),
  isFeatured: Joi.boolean(),
  isFree: Joi.boolean(),
  status: Joi.string().valid(...VALID_STATUSES), // Admin only
});

/**
 * Generic Joi validation middleware factory (same pattern as auth-service).
 */
const validate = (schema) => (req, res, next) => {
  const source = req.method === "GET" ? req.query : req.body;
  const { error, value } = schema.validate(source, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const details = error.details.map((d) => ({
      field: d.path.join("."),
      message: d.message,
    }));
    return res.status(400).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details,
    });
  }

  if (req.method === "GET") {
    req.query = value;
  } else {
    req.body = value;
  }
  next();
};

module.exports = {
  validate,
  createMovieSchema,
  updateMovieSchema,
  updateStatusSchema,
  createReviewSchema,
  updateReviewSchema,
  movieQuerySchema,
};
