// Joi schemas
"use strict";

const Joi = require("joi");

const VALID_PLANS = ["free", "basic", "premium"];
const VALID_QUALITIES = ["360p", "480p", "720p", "1080p", "4K", "auto"];
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

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(60).trim(),
  bio: Joi.string().max(300).allow("", null),
  country: Joi.string().max(100).allow("", null),
  language: Joi.string().max(10),
  dateOfBirth: Joi.date().iso().max("now").allow(null),
  avatar: Joi.string().uri().allow("", null),
});

const updatePreferencesSchema = Joi.object({
  preferredGenres: Joi.array().items(Joi.string().valid(...VALID_GENRES)),
  preferredQuality: Joi.string().valid(...VALID_QUALITIES),
  autoplay: Joi.boolean(),
  notifications: Joi.object({
    email: Joi.boolean(),
    push: Joi.boolean(),
  }),
});

const updateSubscriptionSchema = Joi.object({
  plan: Joi.string()
    .valid(...VALID_PLANS)
    .required(),
  expiresAt: Joi.date().iso().greater("now").allow(null),
  autoRenew: Joi.boolean(),
});

const addToWatchlistSchema = Joi.object({
  movieId: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({ "any.required": "movieId is required" }),
});

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
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

  req.body = value;
  next();
};

module.exports = {
  validate,
  updateProfileSchema,
  updatePreferencesSchema,
  updateSubscriptionSchema,
  addToWatchlistSchema,
};
