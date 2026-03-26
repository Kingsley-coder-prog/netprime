"use strict";

// backend/workers/transcoder/utils/ffmpeg.js

const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { createServiceLogger } = require("../../../shared/logger");

const logger = createServiceLogger("transcoder:ffmpeg");

// ── FFmpeg path resolution ─────────────────────────────────────────────────
// Priority order:
// 1. Environment variables (set in Dockerfile.worker for Docker)
// 2. Auto-detect via `which` (Linux/Mac) or `where` (Windows)
// 3. Fall through — fluent-ffmpeg will use system PATH

function resolveFfmpegPaths() {
  // 1. From environment variables (Docker sets these)
  if (process.env.FFMPEG_PATH && process.env.FFPROBE_PATH) {
    ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
    ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);
    logger.info("FFmpeg path set to: " + process.env.FFMPEG_PATH);
    logger.info("FFprobe path set to: " + process.env.FFPROBE_PATH);
    return;
  }

  // 2. Auto-detect based on OS
  const isWindows = process.platform === "win32";
  const findCmd = isWindows ? "where" : "which";

  try {
    const ffmpegPath = execSync(`${findCmd} ffmpeg`, { encoding: "utf8" })
      .trim()
      .split("\n")[0]
      .trim();
    const ffprobePath = execSync(`${findCmd} ffprobe`, { encoding: "utf8" })
      .trim()
      .split("\n")[0]
      .trim();

    ffmpeg.setFfmpegPath(ffmpegPath);
    ffmpeg.setFfprobePath(ffprobePath);
    logger.info("FFmpeg path set to: " + ffmpegPath);
    logger.info("FFprobe path set to: " + ffprobePath);
  } catch (err) {
    logger.warn(
      "Could not auto-detect ffmpeg/ffprobe via " +
        findCmd +
        ": " +
        err.message,
    );
    logger.warn("Falling back to system PATH — ensure ffmpeg is installed");
  }
}

resolveFfmpegPaths();

// ── Quality profiles ───────────────────────────────────────────────────────
const QUALITY_PROFILES = [
  {
    quality: "240p",
    width: 426,
    height: 240,
    videoBitrate: "400k",
    audioBitrate: "64k",
  },
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

// ── transcodeToHLS ─────────────────────────────────────────────────────────
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
      .outputOptions([
        "-hls_time 6",
        "-hls_playlist_type vod",
        "-hls_segment_filename",
        segmentPath,
        "-hls_flags independent_segments",
        "-movflags +faststart",
      ])
      .output(manifestPath)
      .on("codecData", (data) => {
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

// ── getVideoMetadata ───────────────────────────────────────────────────────
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

// ── getApplicableProfiles ──────────────────────────────────────────────────
const getApplicableProfiles = (sourceHeight) => {
  return QUALITY_PROFILES.filter((p) => p.height <= sourceHeight);
};

module.exports = {
  transcodeToHLS,
  getVideoMetadata,
  getApplicableProfiles,
  QUALITY_PROFILES,
};
