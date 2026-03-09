"use strict";

const { Queue } = require("bullmq");
const config = require("../../../config");
const { createServiceLogger } = require("../../../shared/logger");

const logger = createServiceLogger("upload-service:queue");

let transcodeQueue = null;

/**
 * Returns the singleton BullMQ transcoding queue.
 * Lazily created on first call.
 */
const getTranscodeQueue = () => {
  if (transcodeQueue) return transcodeQueue;

  transcodeQueue = new Queue("transcode", {
    connection: {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
    },
    defaultJobOptions: {
      attempts: 3, // Retry failed jobs up to 3 times
      backoff: {
        type: "exponential",
        delay: 5000, // 5s → 25s → 125s between retries
      },
      removeOnComplete: { count: 100 }, // Keep last 100 completed jobs
      removeOnFail: { count: 200 }, // Keep last 200 failed jobs for debugging
    },
  });

  transcodeQueue.on("error", (err) => {
    logger.error("Transcode queue error:", err);
  });

  logger.info("Transcode queue initialized.");
  return transcodeQueue;
};

/**
 * Add a transcoding job to the queue.
 *
 * @param {object} jobData
 * @param {string} jobData.uploadId    - Upload document _id
 * @param {string} jobData.s3KeyRaw    - S3 key of the raw uploaded file
 * @param {string} jobData.s3BucketRaw - S3 bucket of the raw file
 * @param {string} jobData.movieId     - Movie document _id (to update after transcoding)
 * @param {string} jobData.userId      - User who triggered the upload
 * @returns {Promise<Job>}
 */
const enqueueTranscodeJob = async (jobData) => {
  const queue = getTranscodeQueue();

  const job = await queue.add("transcode-video", jobData, {
    jobId: `transcode-${jobData.uploadId}`, // Idempotent - prevents duplicate jobs
  });

  logger.info(
    `Transcoding job enqueued: jobId=${job.id} uploadId=${jobData.uploadId}`,
  );
  return job;
};

/**
 * Get the status of a specific job by its ID.
 */
const getJobStatus = async (jobId) => {
  const queue = getTranscodeQueue();
  const job = await queue.getJob(jobId);
  if (!job) return null;

  const state = await job.getState();
  const progress = job.progress || 0;

  return { jobId: job.id, state, progress, data: job.data };
};

/**
 * Close the queue connection gracefully on shutdown.
 */
const closeQueue = async () => {
  if (transcodeQueue) {
    await transcodeQueue.close();
    transcodeQueue = null;
    logger.info("Transcode queue closed.");
  }
};

module.exports = {
  getTranscodeQueue,
  enqueueTranscodeJob,
  getJobStatus,
  closeQueue,
};
