// Joi schemas
"use strict";

const Joi = require("joi");

const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .messages({
    "string.pattern.base":
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
  });

const registerSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(60)
    .trim()
    .required()
    .messages({ "any.required": "Name is required" }),
  email: Joi.string().email().lowercase().trim().required().messages({
    "any.required": "Email is required",
    "string.email": "Invalid email format",
  }),
  password: passwordSchema
    .required()
    .messages({ "any.required": "Password is required" }),
  confirmPassword: Joi.any()
    .valid(Joi.ref("password"))
    .required()
    .messages({ "any.only": "Passwords do not match" }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: passwordSchema.required(),
  confirmPassword: Joi.any()
    .valid(Joi.ref("password"))
    .required()
    .messages({ "any.only": "Passwords do not match" }),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: passwordSchema.required(),
  confirmPassword: Joi.any()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({ "any.only": "Passwords do not match" }),
});

/**
 * Generic Joi validation middleware factory.
 * Usage: router.post('/register', validate(registerSchema), controller)
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false, // Return ALL errors at once
    stripUnknown: true, // Remove fields not in schema
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

  req.body = value; // Use sanitised value
  next();
};

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
};
