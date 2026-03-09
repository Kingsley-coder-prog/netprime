// Express app bootstrap
"use strict";

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");

const config = require("../../config");
const { connectDB, disconnectDB } = require("../../shared/db");
const { disconnectRedis } = require("../../shared/redis");
const { createServiceLogger } = require("../../shared/logger");
const errorHandler = require("../../shared/errors/errorHandler");
const { closeQueue } = require("./utils/queue");
const uploadRoutes = require("./routes/upload.routes");

const logger = createServiceLogger("upload-service");
const app = express();
const PORT = config.ports.upload;

app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(compression());

// Note: no body size limit here beyond the JSON payload.
// Actual video bytes go directly from client → S3 via presigned URL.
// This service only handles JSON metadata.
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  morgan("combined", {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }),
);

// ---- Health check ----
app.get("/health", (req, res) =>
  res.json({
    service: "upload-service",
    status: "ok",
    uptime: process.uptime(),
  }),
);

// ---- Routes ----
app.use("/api/uploads", uploadRoutes);

// ---- 404 ----
app.use("*", (req, res) =>
  res
    .status(404)
    .json({ success: false, message: `Route ${req.originalUrl} not found` }),
);

// ---- Error handler ----
app.use(errorHandler);

// ---- Boot ----
const start = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    logger.info(`Upload Service running on port ${PORT} [${config.env}]`);
  });

  // ---- Graceful shutdown ----
  const shutdown = async (signal) => {
    logger.warn(`${signal} - shutting down upload-service...`);
    server.close(async () => {
      await closeQueue(); // Close BullMQ connection cleanly
      await disconnectDB();
      await disconnectRedis();
      logger.info("Upload service shut down cleanly.");
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

module.exports = app;
