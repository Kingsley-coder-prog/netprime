"use strict";

const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/upload.controller");
const {
  validate,
  presignedUrlSchema,
  confirmUploadSchema,
} = require("../validators/upload.validator");
const { uploadLimiter } = require("../../../shared/redis/rateLimiter");

// All upload routes require authentication (enforced at gateway level).
// Here we just do a lightweight header check since gateway already verified JWT.
const requireAuth = (req, res, next) => {
  if (!req.headers["x-user-id"]) {
    return res.status(401).json({
      success: false,
      code: "AUTHENTICATION_ERROR",
      message: "Authentication required",
    });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.headers["x-user-role"] !== "admin") {
    return res.status(403).json({
      success: false,
      code: "AUTHORIZATION_ERROR",
      message: "Admin access required",
    });
  }
  next();
};

const requireInternalSecret = (req, res, next) => {
  if (
    req.headers["x-internal-secret"] !== process.env.INTERNAL_SERVICE_SECRET
  ) {
    return res.status(403).json({
      success: false,
      code: "AUTHORIZATION_ERROR",
      message: "Internal service access only",
    });
  }
  next();
};

// ---- Internal: update upload status (called by transcoder worker) ----
// Must be BEFORE requireAuth since transcoder doesn't have a user token
router.patch(
  "/internal/:uploadId",
  requireInternalSecret,
  ctrl.updateUploadStatus,
);

// Apply auth to all routes in this router
router.use(requireAuth);

// ---- Upload flow (2-step: presign → confirm) ----
router.post(
  "/presigned-url",
  uploadLimiter, // Strict limit: 20 uploads/hour
  validate(presignedUrlSchema),
  ctrl.getPresignedUrl,
);

router.post("/confirm", validate(confirmUploadSchema), ctrl.confirmUpload);

// ---- Status polling ----
router.get("/:uploadId/status", ctrl.getUploadStatus);

// ---- List uploads ----
router.get("/", ctrl.getUploads);

// ---- Admin: delete upload ----
router.delete("/:uploadId", requireAdmin, ctrl.deleteUpload);

module.exports = router;
