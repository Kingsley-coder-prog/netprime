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
const userRoutes = require("./routes/user.routes");

const logger = createServiceLogger("user-service");
const app = express();
const PORT = config.ports.user;

app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(compression());
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  morgan("combined", {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }),
);

app.get("/health", (req, res) =>
  res.json({ service: "user-service", status: "ok", uptime: process.uptime() }),
);

app.use("/api/users", userRoutes);

app.use("*", (req, res) =>
  res
    .status(404)
    .json({ success: false, message: `Route ${req.originalUrl} not found` }),
);

app.use(errorHandler);

const start = async () => {
  await connectDB();
  const server = app.listen(PORT, () => {
    logger.info(`User Service running on port ${PORT} [${config.env}]`);
  });

  const shutdown = async (signal) => {
    logger.warn(`${signal} - shutting down user-service...`);
    server.close(async () => {
      await disconnectDB();
      await disconnectRedis();
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
