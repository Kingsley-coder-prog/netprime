// Joi schemas
"use strict";

const Joi = require("joi");

const VALID_QUALITIES = ["240p", "360p", "480p", "720p", "1080p", "4K", "auto"];

/**
 * Schema for requesting a stream URL.
 * Client sends movieId and optionally a preferred quality.
 */
const streamRequestSchema = Joi.object({
  quality: Joi.string()
    .valid(...VALID_QUALITIES)
    .default("auto"),
});

/**
 * Schema for saving watch progress.
 * Client sends this periodically (e.g. every 10 seconds) while watching.
 */
const progressUpdateSchema = Joi.object({
  progressSeconds: Joi.number()
    .min(0)
    .required()
    .messages({ "any.required": "progressSeconds is required" }),
  durationSeconds: Joi.number()
    .min(0)
    .required()
    .messages({ "any.required": "durationSeconds is required" }),
  quality: Joi.string()
    .valid(...VALID_QUALITIES)
    .default("auto"),
});

/**
 * Generic Joi validation middleware.
 * Validates req.query for GET, req.body for POST/PATCH.
 */
const validate = (schema) => (req, res, next) => {
  const source = ["GET", "DELETE"].includes(req.method) ? req.query : req.body;
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

  if (["GET", "DELETE"].includes(req.method)) {
    req.query = value;
  } else {
    req.body = value;
  }
  next();
};

module.exports = {
  validate,
  streamRequestSchema,
  progressUpdateSchema,
  VALID_QUALITIES,
};
