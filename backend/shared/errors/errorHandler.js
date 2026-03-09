// Global Express error handler
"use strict";

const { AppError } = require("../errors");
const { createServiceLogger } = require("../logger");

const logger = createServiceLogger("error-handler");

/**
 * Central Express error handler.
 * Attach as the LAST middleware in any service: app.use(errorHandler)
 */
const errorHandler = (err, req, res, next) => {
  // eslint-disable-line no-unused-vars
  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({
      success: false,
      code: "CONFLICT",
      message: `${field} already exists`,
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      code: "INVALID_TOKEN",
      message: "Invalid token",
    });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      code: "TOKEN_EXPIRED",
      message: "Token has expired",
    });
  }

  // Our own operational errors
  if (err instanceof AppError && err.isOperational) {
    if (err.statusCode >= 500) {
      logger.error({ message: err.message, stack: err.stack, path: req.path });
    }
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      ...(err.details && { details: err.details }),
    });
  }

  // Unknown / programmer errors - log full stack, hide detail from client
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  return res.status(500).json({
    success: false,
    code: "INTERNAL_ERROR",
    message:
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred"
        : err.message,
  });
};

module.exports = errorHandler;
