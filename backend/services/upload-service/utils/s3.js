"use strict";

const {
  S3Client,
  DeleteObjectCommand,
  HeadObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const config = require("../../../config");
const { createServiceLogger } = require("../../../shared/logger");

const logger = createServiceLogger("upload-service:s3");

// ---- Build S3 client (works for AWS S3 and Cloudflare R2) ----
const s3Client = new S3Client({
  region: config.s3.region,
  credentials: {
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey,
  },
  // R2 requires a custom endpoint; leave undefined for standard AWS S3
  ...(config.s3.endpoint && { endpoint: config.s3.endpoint }),
});

/**
 * Generate a presigned PUT URL so the client can upload directly to S3.
 * The server never touches the file bytes — massive scalability win.
 *
 * @param {object} options
 * @param {string} options.key        - S3 object key (path inside bucket)
 * @param {string} options.mimeType   - File MIME type
 * @param {number} options.expiresIn  - URL validity in seconds (default 15 min)
 * @returns {Promise<string>}         - Presigned URL
 */
const generatePresignedUploadUrl = async ({
  key,
  mimeType,
  expiresIn = 900,
}) => {
  const command = new PutObjectCommand({
    Bucket: config.s3.bucketRaw,
    Key: key,
    ContentType: mimeType,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });
  logger.debug(`Generated presigned upload URL for key: ${key}`);
  return url;
};

/**
 * Generate a presigned GET URL for reading a processed file from HLS bucket.
 * Used by stream-service to give authenticated users time-limited access.
 */
const generatePresignedDownloadUrl = async ({
  key,
  bucket,
  expiresIn = 3600,
}) => {
  const { GetObjectCommand } = require("@aws-sdk/client-s3");
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn });
};

/**
 * Delete an object from S3. Used to clean up raw files after transcoding.
 */
const deleteObject = async ({ key, bucket }) => {
  try {
    await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    logger.info(`Deleted S3 object: ${bucket}/${key}`);
  } catch (err) {
    logger.error(`Failed to delete S3 object ${bucket}/${key}:`, err);
    throw err;
  }
};

/**
 * Check if an S3 object exists (used to verify upload before queuing job).
 */
const objectExists = async ({ key, bucket }) => {
  try {
    await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (err) {
    if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404)
      return false;
    throw err;
  }
};

/**
 * Build the S3 key for a raw upload.
 * Pattern: raw/YYYY/MM/userId/uuid-safeFilename
 */
const buildRawS3Key = ({ userId, uploadId, originalName }) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `raw/${year}/${month}/${userId}/${uploadId}-${safeName}`;
};

module.exports = {
  s3Client,
  generatePresignedUploadUrl,
  generatePresignedDownloadUrl,
  deleteObject,
  objectExists,
  buildRawS3Key,
};
