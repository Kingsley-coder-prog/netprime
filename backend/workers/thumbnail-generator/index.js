"use strict";

const { Worker } = require("bullmq");
const { Queue } = require("bullmq");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");
const os = require("os");
const axios = require("axios");

const config = require("../../config");
const { createServiceLogger } = require("../../shared/logger");
const { downloadFromS3, uploadFileToS3 } = require("../transcoder/utils/s3");

const logger = createServiceLogger("thumbnail-worker");

/**
 * Extract a thumbnail image from a video at a given timestamp.
 *
 * @param {string} inputPath  - Local path to the video file
 * @param {string} outputPath - Where to write the .jpg thumbnail
 * @param {number} atSeconds  - Timestamp to capture (default: 30s in)
 */
const extractThumbnail = (inputPath, outputPath, atSeconds = 30) => {
  return new Promise((resolve, reject) => {
    const outputDir = path.dirname(outputPath);
    const outputFile = path.basename(outputPath);

    ffmpeg(inputPath)
      .screenshots({
        timestamps: [atSeconds],
        filename: outputFile,
        folder: outputDir,
        size: "1280x720",
      })
      .on("end", resolve)
      .on("error", reject);
  });
};

/**
 * Generate multiple thumbnails at different timestamps for a "preview strip".
 * Returns array of local file paths.
 */
const extractThumbnailStrip = async ({ inputPath, workDir, count = 5 }) => {
  // Get total duration first
  const { getVideoMetadata } = require("../transcoder/utils/ffmpeg");
  const { durationSec } = await getVideoMetadata(inputPath);

  const interval = Math.floor(durationSec / (count + 1));
  const paths = [];

  for (let i = 1; i <= count; i++) {
    const timestamp = interval * i;
    const thumbPath = path.join(workDir, `thumb_${i}.jpg`);
    await extractThumbnail(inputPath, thumbPath, timestamp);
    paths.push(thumbPath);
  }

  return paths;
};

// ============================================================
//  JOB PROCESSOR
// ============================================================

const processThumbnailJob = async (job) => {
  const { movieId, uploadId, s3KeyRaw, s3BucketRaw } = job.data;

  logger.info(`Processing thumbnail job ${job.id} — movieId: ${movieId}`);

  const workDir = path.join(os.tmpdir(), `cinemax-thumb-${job.id}`);
  const rawVideoPath = path.join(workDir, "source.mp4");
  fs.mkdirSync(workDir, { recursive: true });

  try {
    // ---- Download raw video ----
    await downloadFromS3({
      bucket: s3BucketRaw,
      key: s3KeyRaw,
      localPath: rawVideoPath,
    });
    await job.updateProgress(30);

    // ---- Extract poster thumbnail (30s in) ----
    const posterPath = path.join(workDir, "poster.jpg");
    await extractThumbnail(rawVideoPath, posterPath, 30);
    await job.updateProgress(50);

    // ---- Extract preview strip (5 thumbnails) ----
    const stripPaths = await extractThumbnailStrip({
      inputPath: rawVideoPath,
      workDir,
      count: 5,
    });
    await job.updateProgress(80);

    // ---- Upload poster to S3 ----
    const posterS3Key = `thumbnails/${movieId}/poster.jpg`;
    await uploadFileToS3({
      localPath: posterPath,
      bucket: config.s3.bucketHls,
      key: posterS3Key,
      contentType: "image/jpeg",
    });

    // ---- Upload preview strip ----
    const stripS3Keys = [];
    for (let i = 0; i < stripPaths.length; i++) {
      const key = `thumbnails/${movieId}/strip_${i + 1}.jpg`;
      await uploadFileToS3({
        localPath: stripPaths[i],
        bucket: config.s3.bucketHls,
        key,
        contentType: "image/jpeg",
      });
      stripS3Keys.push(key);
    }

    await job.updateProgress(95);

    // ---- Update Movie document with thumbnail keys ----
    try {
      await axios.patch(
        `${config.services.movie}/api/movies/${movieId}/thumbnails`,
        { posterKey: posterS3Key, stripKeys: stripS3Keys },
        {
          headers: { "x-internal-secret": config.internalSecret },
          timeout: 5000,
        },
      );
    } catch (err) {
      logger.warn(
        `Could not update movie thumbnails for ${movieId}:`,
        err.message,
      );
    }

    await job.updateProgress(100);
    logger.info(`Thumbnail job ${job.id} complete — poster: ${posterS3Key}`);

    return { posterS3Key, stripS3Keys };
  } catch (err) {
    logger.error(`Thumbnail job ${job.id} failed:`, err.message);
    throw err;
  } finally {
    // Clean up temp files
    try {
      fs.rmSync(workDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
};

// ============================================================
//  WORKER BOOTSTRAP
// ============================================================

const start = () => {
  const worker = new Worker("thumbnail", processThumbnailJob, {
    connection: {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
    },
    concurrency: 4, // Thumbnails are cheaper than full transcodes
  });

  worker.on("completed", (job, result) => {
    logger.info(`Thumbnail job ${job.id} done — poster: ${result.posterS3Key}`);
  });

  worker.on("failed", (job, err) => {
    logger.error(`Thumbnail job ${job?.id} failed: ${err.message}`);
  });

  worker.on("error", (err) => {
    logger.error("Thumbnail worker error:", err);
  });

  const shutdown = async (signal) => {
    logger.warn(`${signal} — shutting down thumbnail worker...`);
    await worker.close();
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  logger.info("Thumbnail worker started. Waiting for jobs...");
};

start();
