"use strict";

const { v4: uuidv4 } = require("uuid");
const Upload = require("../models/Upload");
const {
  generatePresignedUploadUrl,
  buildRawS3Key,
  objectExists,
} = require("../utils/s3");
const { enqueueTranscodeJob, getJobStatus } = require("../utils/queue");
const { createServiceLogger } = require("../../../shared/logger");
const { NotFoundError, AppError } = require("../../../shared/errors");
const config = require("../../../config");

const logger = createServiceLogger("upload-service");

// ============================================================
//  STEP 1 — Request a presigned upload URL
// ============================================================

/**
 * POST /api/uploads/presigned-url
 *
 * Flow:
 *   1. Client sends { fileName, mimeType, sizeBytes, movieId }
 *   2. Server creates an Upload document (status: pending)
 *   3. Server generates a presigned S3 PUT URL
 *   4. Server returns { uploadId, presignedUrl, s3Key, expiresIn }
 *   5. Client PUTs the file directly to S3 using presignedUrl
 *   6. Client calls /confirm once upload is done
 *
 * Why presigned URLs?
 *   The video file never passes through our Node.js servers.
 *   S3 handles the bytes directly → no memory pressure, no timeout risk.
 */
const getPresignedUrl = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    const { fileName, mimeType, sizeBytes, movieId } = req.body;

    const uploadId = uuidv4();
    const s3Key = buildRawS3Key({ userId, uploadId, originalName: fileName });

    // Create Upload record immediately so we can track it
    const upload = await Upload.create({
      uploadId,
      uploadedBy: userId,
      movieId,
      originalName: fileName,
      mimeType,
      sizeBytes,
      s3KeyRaw: s3Key,
      s3BucketRaw: config.s3.bucketRaw,
      status: "pending",
    });

    // Generate presigned PUT URL (valid 15 minutes)
    const presignedUrl = await generatePresignedUploadUrl({
      key: s3Key,
      mimeType,
      expiresIn: 900,
    });

    logger.info(
      `Presigned URL generated for user ${userId}, uploadId: ${upload.uploadId}`,
    );

    res.status(201).json({
      success: true,
      data: {
        uploadId: upload.uploadId,
        presignedUrl, // Client PUTs directly to this URL
        s3Key,
        expiresIn: 900, // Seconds until URL expires
        maxSizeBytes: sizeBytes,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
//  STEP 2 — Confirm upload complete, dispatch transcoding job
// ============================================================

/**
 * POST /api/uploads/confirm
 *
 * Client calls this after successfully PUTting the file to S3.
 * Server verifies the file exists in S3, then dispatches a BullMQ job.
 */
const confirmUpload = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    const { uploadId } = req.body;

    const upload = await Upload.findOne({ uploadId });
    if (!upload) throw new NotFoundError("Upload");

    // Security: users can only confirm their own uploads
    if (upload.uploadedBy.toString() !== userId) {
      throw new AppError(
        "You do not own this upload",
        403,
        "AUTHORIZATION_ERROR",
      );
    }

    if (upload.status !== "pending") {
      return res.json({
        success: true,
        message: `Upload already in status: ${upload.status}`,
        data: { upload },
      });
    }

    // Verify the file actually landed in S3 before queuing
    const exists = await objectExists({
      key: upload.s3KeyRaw,
      bucket: upload.s3BucketRaw,
    });

    if (!exists) {
      throw new AppError(
        "File not found in storage. Please retry the upload.",
        422,
        "FILE_NOT_FOUND_IN_STORAGE",
      );
    }

    // Dispatch transcoding job to BullMQ
    const job = await enqueueTranscodeJob({
      uploadId: upload.uploadId,
      s3KeyRaw: upload.s3KeyRaw,
      s3BucketRaw: upload.s3BucketRaw,
      movieId: upload.movieId?.toString(),
      userId,
    });

    // Update upload record
    upload.status = "queued";
    upload.jobId = job.id;
    upload.queuedAt = new Date();
    await upload.save();

    logger.info(
      `Upload confirmed and queued: uploadId=${uploadId} jobId=${job.id}`,
    );

    res.json({
      success: true,
      message: "Upload confirmed. Transcoding has been queued.",
      data: {
        uploadId: upload.uploadId,
        jobId: job.id,
        status: upload.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
//  STEP 3 — Poll upload/transcoding status
// ============================================================

/**
 * GET /api/uploads/:uploadId/status
 * Client polls this to show progress bar during transcoding.
 */
const getUploadStatus = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    const isAdmin = req.headers["x-user-role"] === "admin";
    const { uploadId } = req.params;

    const upload = await Upload.findOne({ uploadId });
    if (!upload) throw new NotFoundError("Upload");

    if (!isAdmin && upload.uploadedBy.toString() !== userId) {
      throw new AppError(
        "You do not own this upload",
        403,
        "AUTHORIZATION_ERROR",
      );
    }

    // If queued or processing, fetch live progress from BullMQ
    let jobStatus = null;
    if (upload.jobId && ["queued", "processing"].includes(upload.status)) {
      jobStatus = await getJobStatus(upload.jobId);
    }

    res.json({
      success: true,
      data: {
        uploadId: upload.uploadId,
        status: upload.status,
        progress: jobStatus?.progress ?? upload.progress,
        movieId: upload.movieId,
        originalName: upload.originalName,
        sizeMB: upload.sizeMB,
        outputs: upload.outputs,
        errorMessage: upload.errorMessage,
        queuedAt: upload.queuedAt,
        startedAt: upload.startedAt,
        completedAt: upload.completedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
//  ADMIN — List all uploads
// ============================================================

/**
 * GET /api/uploads
 * Admin: see all uploads. User: see own uploads only.
 */
const getUploads = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    const isAdmin = req.headers["x-user-role"] === "admin";
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = isAdmin ? {} : { uploadedBy: userId };
    if (req.query.status) filter.status = req.query.status;

    const [uploads, total] = await Promise.all([
      Upload.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Upload.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        uploads,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/uploads/:uploadId
 * Admin only. Cancels a pending/queued upload.
 */
const deleteUpload = async (req, res, next) => {
  try {
    const upload = await Upload.findOne({ uploadId: req.params.uploadId });
    if (!upload) throw new NotFoundError("Upload");

    if (["processing", "completed"].includes(upload.status)) {
      throw new AppError(
        `Cannot delete an upload in status: ${upload.status}`,
        409,
        "CONFLICT",
      );
    }

    // Optionally clean up S3 raw file
    try {
      const { deleteObject } = require("../utils/s3");
      await deleteObject({ key: upload.s3KeyRaw, bucket: upload.s3BucketRaw });
    } catch {
      logger.warn(
        `Could not delete S3 raw object for upload ${upload.uploadId}`,
      );
    }

    await upload.deleteOne();
    res.json({ success: true, message: "Upload deleted." });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /:uploadId
 * Internal only — called by transcoder worker to update upload status.
 */
const updateUploadStatus = async (req, res, next) => {
  try {
    const { uploadId } = req.params;
    const upload = await Upload.findOne({ uploadId });
    if (!upload) throw new NotFoundError("Upload");

    Object.assign(upload, req.body);
    await upload.save();

    res.json({ success: true, data: { upload } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPresignedUrl,
  confirmUpload,
  getUploadStatus,
  updateUploadStatus,
  getUploads,
  deleteUpload,
};
