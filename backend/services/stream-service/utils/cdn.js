"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const config = require("../../../config");
const { createServiceLogger } = require("../../../shared/logger");

const logger = createServiceLogger("stream-service:cdn");

/**
 * Generates a time-limited signed URL for a CDN-hosted HLS file.
 *
 * Supports two CDN providers:
 *  - CloudFront  (AWS) — uses RSA signed policy
 *  - Cloudflare  — uses HMAC token query param
 *
 * Falls back to a direct S3 presigned URL if no CDN is configured (dev mode).
 *
 * @param {object} options
 * @param {string} options.s3Key     - HLS manifest key e.g. "hls/uuid/720p/index.m3u8"
 * @param {number} options.expiresIn - Seconds until URL expires (default: 4 hours)
 * @returns {string}                 - Signed URL the client uses to stream
 */
const generateSignedStreamUrl = async ({ s3Key, expiresIn = 4 * 60 * 60 }) => {
  const { baseUrl, keyId, privateKeyPath } = config.cdn;

  // ---- Dev / no CDN configured: return a plain CDN URL ----
  if (!baseUrl) {
    logger.warn("CDN_BASE_URL not set — returning unsigned URL (dev only)");
    return `https://${config.s3.bucketHls}.s3.${config.s3.region}.amazonaws.com/${s3Key}`;
  }

  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
  const resourceUrl = `${baseUrl}/${s3Key}`;

  // ---- CloudFront signed URL ----
  if (keyId && privateKeyPath) {
    return signCloudFrontUrl({ resourceUrl, keyId, privateKeyPath, expiresAt });
  }

  // ---- Cloudflare signed URL ----
  if (config.cdn.hmacSecret) {
    return signCloudflareUrl({ resourceUrl, expiresAt });
  }

  // ---- No signing key — plain CDN URL (dev) ----
  return resourceUrl;
};

/**
 * CloudFront signed URL using RSA-SHA1.
 * Requires a CloudFront key pair and key ID from AWS console.
 */
const signCloudFrontUrl = ({
  resourceUrl,
  keyId,
  privateKeyPath,
  expiresAt,
}) => {
  try {
    const resolvedKeyPath = path.resolve(privateKeyPath);
    const privateKey = fs.readFileSync(resolvedKeyPath, "utf8");

    // CloudFront canned policy
    const policy = JSON.stringify({
      Statement: [
        {
          Resource: resourceUrl,
          Condition: { DateLessThan: { "AWS:EpochTime": expiresAt } },
        },
      ],
    });

    const policyB64 = Buffer.from(policy)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/=/g, "_")
      .replace(/\//g, "~");

    const sign = crypto.createSign("RSA-SHA1");
    sign.update(policy);
    const signature = sign
      .sign(privateKey, "base64")
      .replace(/\+/g, "-")
      .replace(/=/g, "_")
      .replace(/\//g, "~");

    return `${resourceUrl}?Policy=${policyB64}&Signature=${signature}&Key-Pair-Id=${keyId}`;
  } catch (err) {
    logger.error("CloudFront URL signing failed:", err);
    throw err;
  }
};

/**
 * Cloudflare token-based signed URL using HMAC-SHA256.
 */
const signCloudflareUrl = async ({ resourceUrl, expiresAt }) => {
  const encoder = new TextEncoder();
  const secretKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(config.cdn.hmacSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const dataToSign = `${resourceUrl}${expiresAt}`;
  const signature = await crypto.subtle.sign(
    "HMAC",
    secretKey,
    encoder.encode(dataToSign),
  );
  const token = Buffer.from(signature).toString("hex").slice(0, 32);

  return `${resourceUrl}?token=${token}&expires=${expiresAt}`;
};

/**
 * Build all stream URLs for a movie's available qualities.
 * Returns an array the client can use to build a quality selector.
 *
 * @param {Array}  videoFiles - Movie.videoFiles array from MongoDB
 * @param {number} expiresIn  - URL TTL in seconds
 */
const buildStreamManifest = async (videoFiles, expiresIn = 4 * 60 * 60) => {
  const streams = await Promise.all(
    videoFiles.map(async (vf) => ({
      quality: vf.quality,
      url: await generateSignedStreamUrl({ s3Key: vf.s3Key, expiresIn }),
      duration: vf.duration,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    })),
  );
  return streams;
};

module.exports = { generateSignedStreamUrl, buildStreamManifest };
