"use strict";

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");
const { createProxyMiddleware } = require("http-proxy-middleware");

const config = require("../config");
const { createServiceLogger } = require("../shared/logger");
const { globalLimiter } = require("../shared/redis/rateLimiter");
const errorHandler = require("../shared/errors/errorHandler");
const { authenticate } = require("./middleware/gatewayAuth");

const logger = createServiceLogger("gateway");
const app = express();
const PORT = config.ports.gateway;

// ---- Security ----
app.use(helmet());
app.use(
  cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(compression());
app.use(
  morgan("combined", {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }),
);

// ---- Global rate limit ----
app.use(globalLimiter);

// ---- Health ----
app.get("/health", (req, res) => {
  res.json({
    service: "api-gateway",
    status: "ok",
    timestamp: new Date().toISOString(),
    services: config.services,
  });
});

// ---- Proxy helper ----
const proxy = (target, pathRewrite) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
    on: {
      error: (err, req, res) => {
        logger.error(`Proxy error to ${target}: ${err.message}`);
        res.status(503).json({
          success: false,
          code: "SERVICE_UNAVAILABLE",
          message: "Service temporarily unavailable",
        });
      },
    },
  });

// ---- Routes ----

// Auth - public (no gateway auth check, service handles its own)
app.use("/api/auth", proxy(config.services.auth));

// All routes below require a valid JWT verified at the gateway level
app.use("/api/users", authenticate, proxy(config.services.user));
app.use("/api/movies", authenticate, proxy(config.services.movie));
app.use("/api/stream", authenticate, proxy(config.services.stream));
app.use("/api/uploads", authenticate, proxy(config.services.upload));

// ---- 404 ----
app.use("*", (req, res) => {
  res
    .status(404)
    .json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

// ---- Boot ----
const start = async () => {
  const { connectDB, disconnectDB } = require("../shared/db");
  const { disconnectRedis } = require("../shared/redis");

  await connectDB();

  const server = app.listen(PORT, () => {
    logger.info(`API Gateway running on port ${PORT} [${config.env}]`);
    logger.info(`Proxying to services:`, config.services);
  });

  const shutdown = async (signal) => {
    logger.warn(`${signal} - shutting down gateway...`);
    server.close(async () => {
      await disconnectDB();
      await disconnectRedis();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

start();

module.exports = app;
