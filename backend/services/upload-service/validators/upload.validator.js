// Joi schemas
"use strict";

const Joi = require("joi");

const ALLOWED_MIME_TYPES = [
  "video/mp4",
  "video/quicktime", // .mov
  "video/x-msvideo", // .avi
  "video/x-matroska", // .mkv
  "video/webm",
  "video/mpeg",
];

const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024 * 1024; // 4 GB

/**
 * Schema for requesting a presigned upload URL.
 * Client sends file metadata BEFORE uploading — server returns a signed S3 URL.
 */
const presignedUrlSchema = Joi.object({
  fileName: Joi.string()
    .max(255)
    .required()
    .messages({ "any.required": "fileName is required" }),
  mimeType: Joi.string()
    .valid(...ALLOWED_MIME_TYPES)
    .required()
    .messages({
      "any.required": "mimeType is required",
      "any.only": `mimeType must be one of: ${ALLOWED_MIME_TYPES.join(", ")}`,
    }),
  sizeBytes: Joi.number()
    .integer()
    .min(1)
    .max(MAX_FILE_SIZE_BYTES)
    .required()
    .messages({
      "any.required": "sizeBytes is required",
      "number.max": "File size cannot exceed 4 GB",
    }),
  movieId: Joi.string().hex().length(24).required().messages({
    "any.required": "movieId is required to link this upload to a movie",
  }),
});

/**
 * Schema for confirming that the client successfully PUT the file to S3.
 * Client calls this after the presigned upload completes.
 */
const confirmUploadSchema = Joi.object({
  uploadId: Joi.string().hex().length(24).required(),
});

/**
 * Generic Joi validation middleware.
 */
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
  presignedUrlSchema,
  confirmUploadSchema,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
};
