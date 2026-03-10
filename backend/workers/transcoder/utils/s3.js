"use strict";

const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const fs = require("fs");
const path = require("path");
const stream = require("stream");
const config = require("../../../config");
const { createServiceLogger } = require("../../../shared/logger");

const logger = createServiceLogger("transcoder:s3");

const s3Client = new S3Client({
  region: config.s3.region,
  credentials: {
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey,
  },
  ...(config.s3.endpoint && { endpoint: config.s3.endpoint }),
});

/**
 * Download a raw video file from S3 to a local temp path.
 * Uses streaming to handle large files without loading into memory.
 */
const downloadFromS3 = async ({ bucket, key, localPath }) => {
  logger.info(`Downloading s3://${bucket}/${key} → ${localPath}`);

  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await s3Client.send(command);

  await new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(localPath);
    response.Body.pipe(writeStream);
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });

  logger.info(`Download complete: ${localPath}`);
};

/**
 * Upload a single file to S3 (e.g. an HLS .ts segment or .m3u8 manifest).
 * Uses multipart upload for large files automatically.
 */
const uploadFileToS3 = async ({ localPath, bucket, key, contentType }) => {
  const fileStream = fs.createReadStream(localPath);

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: bucket,
      Key: key,
      Body: fileStream,
      ContentType: contentType || "application/octet-stream",
    },
  });

  await upload.done();
  logger.debug(`Uploaded: ${key}`);
};

/**
 * Upload an entire directory of HLS segments + manifest to S3.
 * Returns the S3 key of the .m3u8 manifest.
 *
 * @param {string} localDir    - Local directory containing HLS files
 * @param {string} s3KeyPrefix - S3 key prefix e.g. "hls/uuid/720p"
 */
const uploadHLSDirectory = async ({ localDir, s3KeyPrefix }) => {
  const files = fs.readdirSync(localDir);
  const uploadJobs = files.map((fileName) => {
    const localPath = path.join(localDir, fileName);
    const s3Key = `${s3KeyPrefix}/${fileName}`;
    const contentType = fileName.endsWith(".m3u8")
      ? "application/x-mpegURL"
      : "video/MP2T";

    return uploadFileToS3({
      localPath,
      bucket: config.s3.bucketHls,
      key: s3Key,
      contentType,
    });
  });

  await Promise.all(uploadJobs);

  const manifestKey = `${s3KeyPrefix}/index.m3u8`;
  logger.info(`HLS directory uploaded. Manifest: ${manifestKey}`);
  return manifestKey;
};

module.exports = { downloadFromS3, uploadFileToS3, uploadHLSDirectory };
