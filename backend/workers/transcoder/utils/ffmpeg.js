"use strict";

const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { createServiceLogger } = require("../../../shared/logger");

const logger = createServiceLogger("transcoder:ffmpeg");

/**
 * Quality profiles — defines the FFmpeg output settings per quality tier.
 * Each profile produces an HLS stream (segmented .ts files + .m3u8 manifest).
 */
const QUALITY_PROFILES = [
  {
    quality: "360p",
    width: 640,
    height: 360,
    videoBitrate: "600k",
    audioBitrate: "96k",
  },
  {
    quality: "480p",
    width: 854,
    height: 480,
    videoBitrate: "1200k",
    audioBitrate: "128k",
  },
  {
    quality: "720p",
    width: 1280,
    height: 720,
    videoBitrate: "2500k",
    audioBitrate: "128k",
  },
  {
    quality: "1080p",
    width: 1920,
    height: 1080,
    videoBitrate: "5000k",
    audioBitrate: "192k",
  },
];

/**
 * Transcode a single video file into HLS format at a given quality.
 *
 * @param {object} options
 * @param {string} options.inputPath    - Local path to downloaded raw video
 * @param {string} options.outputDir    - Local directory to write HLS segments
 * @param {object} options.profile      - Quality profile from QUALITY_PROFILES
 * @param {function} options.onProgress - Callback({ percent }) for progress updates
 * @returns {Promise<{ manifestPath, durationSec }>}
 */
const transcodeToHLS = ({ inputPath, outputDir, profile, onProgress }) => {
  return new Promise((resolve, reject) => {
    const manifestPath = path.join(outputDir, "index.m3u8");
    const segmentPath = path.join(outputDir, "segment%03d.ts");

    fs.mkdirSync(outputDir, { recursive: true });

    let durationSec = 0;

    ffmpeg(inputPath)
      .videoCodec("libx264")
      .audioCodec("aac")
      .size(`${profile.width}x${profile.height}`)
      .videoBitrate(profile.videoBitrate)
      .audioBitrate(profile.audioBitrate)
      // HLS output options
      .outputOptions([
        "-hls_time 6", // 6-second segments
        "-hls_playlist_type vod", // VOD manifest (not live)
        "-hls_segment_filename",
        segmentPath,
        "-hls_flags independent_segments",
        "-movflags +faststart",
      ])
      .output(manifestPath)
      .on("codecData", (data) => {
        // Parse duration from codec info e.g. "01:32:45.00"
        const parts = data.duration?.split(":");
        if (parts?.length === 3) {
          durationSec = Math.round(
            parseInt(parts[0]) * 3600 +
              parseInt(parts[1]) * 60 +
              parseFloat(parts[2]),
          );
        }
      })
      .on("progress", (progress) => {
        if (onProgress && progress.percent) {
          onProgress({ percent: Math.round(progress.percent) });
        }
      })
      .on("end", () => {
        logger.info(`Transcode complete: ${profile.quality} → ${manifestPath}`);
        resolve({ manifestPath, durationSec });
      })
      .on("error", (err) => {
        logger.error(`FFmpeg error (${profile.quality}):`, err.message);
        reject(err);
      })
      .run();
  });
};

/**
 * Get video metadata (duration, resolution, codec) without transcoding.
 */
const getVideoMetadata = (inputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) return reject(err);

      const videoStream = metadata.streams.find(
        (s) => s.codec_type === "video",
      );
      const audioStream = metadata.streams.find(
        (s) => s.codec_type === "audio",
      );

      resolve({
        durationSec: Math.round(metadata.format.duration || 0),
        width: videoStream?.width,
        height: videoStream?.height,
        videoCodec: videoStream?.codec_name,
        audioCodec: audioStream?.codec_name,
        bitrate: metadata.format.bit_rate,
      });
    });
  });
};

/**
 * Determine which quality profiles to generate based on source resolution.
 * No point upscaling — skip profiles higher than source.
 */
const getApplicableProfiles = (sourceHeight) => {
  return QUALITY_PROFILES.filter((p) => p.height <= sourceHeight);
};

module.exports = {
  transcodeToHLS,
  getVideoMetadata,
  getApplicableProfiles,
  QUALITY_PROFILES,
};
