"use strict";

require("dotenv").config();

const config = {
  env: process.env.NODE_ENV || "development",
  isDev: process.env.NODE_ENV !== "production",

  ports: {
    gateway: parseInt(process.env.GATEWAY_PORT) || 3000,
    auth: parseInt(process.env.AUTH_SERVICE_PORT) || 3001,
    user: parseInt(process.env.USER_SERVICE_PORT) || 3002,
    movie: parseInt(process.env.MOVIE_SERVICE_PORT) || 3003,
    stream: parseInt(process.env.STREAM_SERVICE_PORT) || 3004,
    upload: parseInt(process.env.UPLOAD_SERVICE_PORT) || 3005,
    notification: parseInt(process.env.NOTIFICATION_SERVICE_PORT) || 3006,
  },

  services: {
    auth: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
    user: process.env.USER_SERVICE_URL || "http://localhost:3002",
    movie: process.env.MOVIE_SERVICE_URL || "http://localhost:3003",
    stream: process.env.STREAM_SERVICE_URL || "http://localhost:3004",
    upload: process.env.UPLOAD_SERVICE_URL || "http://localhost:3005",
    notification:
      process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3006",
  },

  mongo: {
    uri: process.env.MONGO_URI || "mongodb://localhost:27017/netprime",
    testUri:
      process.env.MONGO_URI_TEST || "mongodb://localhost:27017/netprime_test",
    options: {
      // Mongoose 8+ - these are the relevant pool options
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    // For BullMQ / ioredis
    retryStrategy: (times) => Math.min(times * 50, 2000),
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || "dev_access_secret",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "dev_refresh_secret",
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },

  s3: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || "us-east-2",
    bucketRaw: process.env.S3_BUCKET_RAW || "netprime-raw-uploads",
    bucketHls: process.env.S3_BUCKET_HLS || "netprime-hls-processed",
    endpoint: process.env.S3_ENDPOINT || undefined, // Cloudflare R2
  },

  cdn: {
    baseUrl: process.env.CDN_BASE_URL || "",
    keyId: process.env.CDN_SIGNED_KEY_ID || "",
    privateKeyPath: process.env.CDN_PRIVATE_KEY_PATH || "",
    hmacSecret: process.env.CDN_HMAC_SECRET || "",
  },

  internalSecret: process.env.INTERNAL_SERVICE_SECRET || "dev_internal_secret",

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    authMax: parseInt(process.env.RATE_LIMIT_AUTH_MAX) || 10,
  },

  email: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.EMAIL_FROM || "netprime <noreply@netprime.com>",
  },

  cors: {
    origin: (process.env.CORS_ORIGIN || "http://localhost:5500")
      .split(",")
      .map((o) => o.trim()),
    credentials: true,
  },

  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,

  logging: {
    level: process.env.LOG_LEVEL || "info",
    dir: process.env.LOG_DIR || "./logs",
  },
};

module.exports = config;
