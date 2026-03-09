// Custom error classes (AppError, NotFoundError, etc.)
"use strict";

/**
 * Base application error. All custom errors extend this.
 */
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode || 500;
    this.code = code || "INTERNAL_ERROR";
    this.isOperational = true; // Distinguish from programmer errors
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details) {
    super(message, 400, "VALIDATION_ERROR");
    this.details = details || null;
  }
}

class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "AUTHENTICATION_ERROR");
  }
}

class AuthorizationError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(message, 403, "AUTHORIZATION_ERROR");
  }
}

class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, "CONFLICT");
  }
}

class RateLimitError extends AppError {
  constructor(message = "Too many requests. Please try again later.") {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
  }
}

class ServiceUnavailableError extends AppError {
  constructor(service) {
    super(
      `${service || "Service"} is temporarily unavailable`,
      503,
      "SERVICE_UNAVAILABLE",
    );
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServiceUnavailableError,
};
