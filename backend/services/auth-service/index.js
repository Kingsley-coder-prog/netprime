// Express app bootstrap
"use strict";

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const compression = require("compression");

const config = require("../../config");
const { connectDB, disconnectDB } = require("../../shared/db");
const { disconnectRedis } = require("../../shared/redis");
const { createServiceLogger } = require("../../shared/logger");
const errorHandler = require("../../shared/errors/errorHandler");
const { globalLimiter } = require("../../shared/redis/rateLimiter");
const authRoutes = require("./routes/auth.routes");

const logger = createServiceLogger("auth-service");
const app = express();
const PORT = config.ports.auth;

// ---- Security middleware ----
app.use(helmet());
app.use(
  cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ---- Perf middleware ----
app.use(compression());

// ---- Parsing ----
app.use(express.json({ limit: "10kb" })); // Prevent JSON body too large
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ---- Logging ----
app.use(
  morgan("combined", {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }),
);

// ---- Global rate limit ----
app.use(globalLimiter);

// ---- Health check (no auth needed, used by LB/K8s) ----
app.get("/health", (req, res) => {
  res.json({
    service: "auth-service",
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ---- Routes ----
app.use("/", authRoutes);

// ---- 404 handler ----
app.use("*", (req, res) => {
  res
    .status(404)
    .json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ---- Error handler (must be last) ----
app.use(errorHandler);

// ---- Boot ----
const start = async () => {
  await connectDB();
  const server = app.listen(PORT, () => {
    logger.info(`Auth Service running on port ${PORT} [${config.env}]`);
  });

  // ---- Graceful shutdown ----
  const shutdown = async (signal) => {
    logger.warn(`${signal} received. Shutting down auth-service...`);
    server.close(async () => {
      await disconnectDB();
      await disconnectRedis();
      logger.info("Auth service shut down cleanly.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled rejection:", reason);
    shutdown("unhandledRejection");
  });
};

start();

module.exports = app; // Export for tests
