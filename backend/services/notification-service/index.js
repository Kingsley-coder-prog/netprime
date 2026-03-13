// Express app bootstrap
"use strict";

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");

const config = require("../../config");
const { createServiceLogger } = require("../../shared/logger");
const errorHandler = require("../../shared/errors/errorHandler");
const notificationRoutes = require("./routes/notification.routes");

const logger = createServiceLogger("notification-service");
const app = express();
const PORT = config.ports.notification;

app.use(helmet());
// Notification service is internal — no need for public CORS
app.use(cors({ origin: false }));
app.use(compression());
app.use(express.json({ limit: "10kb" }));
app.use(
  morgan("combined", {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }),
);

app.get("/health", (req, res) =>
  res.json({
    service: "notification-service",
    status: "ok",
    uptime: process.uptime(),
  }),
);

app.use("/", notificationRoutes);

app.use("*", (req, res) =>
  res
    .status(404)
    .json({ success: false, message: `Route ${req.originalUrl} not found` }),
);

app.use(errorHandler);

const start = async () => {
  const server = app.listen(PORT, () => {
    logger.info(`Notification Service running on port ${PORT} [${config.env}]`);
  });

  // Note: notification-service does not need MongoDB or Redis directly.
  // It is stateless — it just sends emails using Nodemailer.
  const shutdown = async (signal) => {
    logger.warn(`${signal} - shutting down notification-service...`);
    server.close(() => {
      logger.info("Notification service shut down cleanly.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

start();
module.exports = app;
