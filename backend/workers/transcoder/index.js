// Pulls jobs from BullMQ, runs FFmpeg
"use strict";

const { Worker, QueueEvents } = require("bullmq");
const path = require("path");
const fs = require("fs");
const os = require("os");
const axios = require("axios");

const config = require("../../config");
const { connectDB, disconnectDB } = require("../../shared/db");
const { createServiceLogger } = require("../../shared/logger");
const {
  transcodeToHLS,
  getVideoMetadata,
  getApplicableProfiles,
} = require("./utils/ffmpeg");
const { downloadFromS3, uploadHLSDirectory } = require("./utils/s3");

const logger = createServiceLogger("transcoder-worker");

// ============================================================
//  Helper — call notification-service
// ============================================================

const notify = async (endpoint, payload) => {
  try {
    await axios.post(
      `${config.services.notification}/api/notifications/email/${endpoint}`,
      payload,
      {
        headers: { "x-internal-secret": config.internalSecret },
        timeout: 5000,
      },
    );
  } catch (err) {
    // Notification failure is non-fatal — log and continue
    logger.warn(`Notification "${endpoint}" failed:`, err.message);
  }
};

// ============================================================
//  Helper — update Upload and Movie documents via service APIs
// ============================================================

const updateUploadStatus = async (uploadId, patch) => {
  try {
    await axios.patch(
      `${config.services.upload}/api/uploads/${uploadId}`,
      patch,
      {
        headers: { "x-internal-secret": config.internalSecret },
        timeout: 5000,
      },
    );
  } catch (err) {
    logger.warn(`Could not update Upload ${uploadId}:`, err.message);
  }
};

const updateMovieVideoFiles = async (movieId, videoFiles) => {
  try {
    await axios.patch(
      `${config.services.movie}/api/movies/${movieId}/video-files`,
      { videoFiles },
      {
        headers: { "x-internal-secret": config.internalSecret },
        timeout: 5000,
      },
    );
  } catch (err) {
    logger.warn(`Could not update Movie ${movieId} video files:`, err.message);
  }
};

const getUserForNotification = async (userId) => {
  try {
    const res = await axios.get(`${config.services.user}/api/users/${userId}`, {
      headers: { "x-internal-secret": config.internalSecret },
      timeout: 5000,
    });
    return res.data.data.user;
  } catch {
    return null;
  }
};

// ============================================================
//  CORE JOB PROCESSOR
// ============================================================

/**
 * processTranscodeJob is called by BullMQ for each job in the "transcode" queue.
 *
 * Full flow:
 *  1.  Create a temp working directory
 *  2.  Download the raw video from S3 to disk
 *  3.  Probe the video to get dimensions and duration
 *  4.  Determine which quality profiles apply (no upscaling)
 *  5.  For each quality: run FFmpeg → HLS → upload HLS dir to S3
 *  6.  Update the Movie document with all video file keys
 *  7.  Update the Upload document to "completed"
 *  8.  Email the uploader that their movie is ready
 *  9.  Clean up temp directory
 * 10.  On any failure: mark Upload "failed", email the uploader
 */
const processTranscodeJob = async (job) => {
  const { uploadId, s3KeyRaw, s3BucketRaw, movieId, userId } = job.data;

  logger.info(`Processing transcode job ${job.id} — uploadId: ${uploadId}`);

  // Report "processing" state back via job progress
  await job.updateProgress(0);

  // Create an isolated temp directory for this job
  const workDir = path.join(os.tmpdir(), `cinemax-transcode-${job.id}`);
  fs.mkdirSync(workDir, { recursive: true });

  const rawVideoPath = path.join(workDir, "source.mp4");

  try {
    // ---- 1. Download raw video from S3 ----
    await updateUploadStatus(uploadId, {
      status: "processing",
      startedAt: new Date(),
    });
    await job.updateProgress(5);

    await downloadFromS3({
      bucket: s3BucketRaw,
      key: s3KeyRaw,
      localPath: rawVideoPath,
    });
    await job.updateProgress(15);

    // ---- 2. Probe source video ----
    const metadata = await getVideoMetadata(rawVideoPath);
    logger.info(
      `Source metadata: ${metadata.width}x${metadata.height} ${metadata.durationSec}s`,
    );
    await job.updateProgress(20);

    // ---- 3. Determine applicable quality profiles ----
    const profiles = getApplicableProfiles(metadata.height);
    if (profiles.length === 0) {
      throw new Error(
        `Source resolution too low to transcode: ${metadata.height}p`,
      );
    }
    logger.info(
      `Transcoding ${profiles.length} qualities: ${profiles
        .map((p) => p.quality)
        .join(", ")}`,
    );

    // ---- 4. Transcode each quality ----
    const videoFiles = [];
    const progressPerProfile = 70 / profiles.length; // 20% to 90% = 70 points spread across profiles
    let currentProgress = 20;

    for (const profile of profiles) {
      const outputDir = path.join(workDir, profile.quality);
      const s3KeyPrefix = `hls/${uploadId}/${profile.quality}`;

      logger.info(`Transcoding ${profile.quality}...`);

      // Transcode to HLS — FFmpeg writes segments + manifest to outputDir
      const { durationSec } = await transcodeToHLS({
        inputPath: rawVideoPath,
        outputDir,
        profile,
        onProgress: ({ percent }) => {
          // Map FFmpeg's 0-100 to this profile's slice of overall progress
          const profileProgress =
            currentProgress + (percent / 100) * progressPerProfile;
          job.updateProgress(Math.round(profileProgress)).catch(() => {});
        },
      });

      // Upload the HLS directory to S3
      const manifestS3Key = await uploadHLSDirectory({
        localDir: outputDir,
        s3KeyPrefix,
      });

      videoFiles.push({
        quality: profile.quality,
        s3Key: manifestS3Key,
        duration: durationSec || metadata.durationSec,
      });

      currentProgress += progressPerProfile;
      await job.updateProgress(Math.round(currentProgress));
      logger.info(`${profile.quality} complete → ${manifestS3Key}`);
    }

    await job.updateProgress(90);

    // ---- 5. Update Movie document with all video files ----
    if (movieId) {
      await updateMovieVideoFiles(movieId, videoFiles);
    }

    // ---- 6. Mark Upload as completed ----
    await updateUploadStatus(uploadId, {
      status: "completed",
      progress: 100,
      completedAt: new Date(),
      outputs: videoFiles.map((vf) => ({
        quality: vf.quality,
        s3KeyHls: vf.s3Key,
        durationSec: vf.duration,
      })),
    });

    await job.updateProgress(95);

    // ---- 7. Email the uploader ----
    const user = await getUserForNotification(userId);
    if (user?.email) {
      // We need the movie title — try to fetch it
      let movieTitle = "Your movie";
      try {
        const movieRes = await axios.get(
          `${config.services.movie}/api/movies/${movieId}`,
          { timeout: 5000 },
        );
        movieTitle = movieRes.data.data.movie?.title || movieTitle;
      } catch {
        /* non-fatal */
      }

      await notify("transcode-complete", {
        name: user.name,
        email: user.email,
        movieTitle,
        movieId,
      });
    }

    await job.updateProgress(100);
    logger.info(`Transcode job ${job.id} completed successfully.`);

    return { success: true, videoFiles };
  } catch (err) {
    logger.error(`Transcode job ${job.id} failed:`, err.message);

    // Mark Upload as failed
    await updateUploadStatus(uploadId, {
      status: "failed",
      errorMessage: err.message,
    });

    // Email failure notification
    const user = await getUserForNotification(userId).catch(() => null);
    if (user?.email) {
      await notify("transcode-failed", {
        name: user.name,
        email: user.email,
        movieTitle: "Your uploaded movie",
        errorMessage: err.message,
      });
    }

    throw err; // Re-throw so BullMQ marks job as failed and retries if configured
  } finally {
    // Always clean up temp files, even on failure
    try {
      fs.rmSync(workDir, { recursive: true, force: true });
      logger.debug(`Cleaned up temp dir: ${workDir}`);
    } catch (cleanupErr) {
      logger.warn("Temp cleanup failed:", cleanupErr.message);
    }
  }
};

// ============================================================
//  WORKER BOOTSTRAP
// ============================================================

const start = async () => {
  await connectDB(); // Needed if worker updates DB directly as fallback

  const worker = new Worker("transcode", processTranscodeJob, {
    connection: {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
    },
    concurrency: 2, // Process up to 2 transcoding jobs simultaneously
    limiter: {
      max: 2, // Max 2 jobs per second (FFmpeg is CPU-heavy)
      duration: 1000,
    },
  });

  worker.on("active", (job) => {
    logger.info(`Job active: ${job.id} — uploadId: ${job.data.uploadId}`);
  });

  worker.on("completed", (job, result) => {
    logger.info(
      `Job completed: ${job.id} — ${result.videoFiles?.length} qualities produced`,
    );
  });

  worker.on("failed", (job, err) => {
    logger.error(`Job failed: ${job?.id} — ${err.message}`);
  });

  worker.on("progress", (job, progress) => {
    logger.debug(`Job ${job.id} progress: ${progress}%`);
  });

  worker.on("error", (err) => {
    logger.error("Worker error:", err);
  });

  // ---- Graceful shutdown ----
  const shutdown = async (signal) => {
    logger.warn(`${signal} — shutting down transcoder worker...`);
    await worker.close();
    await disconnectDB();
    logger.info("Transcoder worker shut down cleanly.");
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled rejection:", reason);
    shutdown("unhandledRejection");
  });

  logger.info("Transcoder worker started. Waiting for jobs...");
};

start();
