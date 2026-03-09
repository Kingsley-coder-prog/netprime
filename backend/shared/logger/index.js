// Winston logger factory
"use strict";

const { createLogger, format, transports } = require("winston");
require("winston-daily-rotate-file");
const path = require("path");
const config = require("../../config");

const { combine, timestamp, errors, json, colorize, printf } = format;

// Human-readable format for dev console
const devFormat = combine(
  colorize(),
  timestamp({ format: "HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, service, stack }) => {
    const svc = service ? `[${service}]` : "";
    return `${timestamp} ${level} ${svc} ${stack || message}`;
  }),
);

// Structured JSON for production / log aggregators
const prodFormat = combine(timestamp(), errors({ stack: true }), json());

/**
 * Creates a service-scoped logger.
 * Usage: const logger = require('../shared/logger').createServiceLogger('auth-service');
 */
const createServiceLogger = (serviceName) => {
  const logDir = path.resolve(config.logging.dir);

  const fileTransport = new transports.DailyRotateFile({
    dirname: logDir,
    filename: `${serviceName}-%DATE%.log`,
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d",
    level: config.logging.level,
  });

  const errorFileTransport = new transports.DailyRotateFile({
    dirname: logDir,
    filename: `${serviceName}-error-%DATE%.log`,
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "30d",
    level: "error",
  });

  return createLogger({
    defaultMeta: { service: serviceName },
    format: config.isDev ? devFormat : prodFormat,
    transports: [
      new transports.Console({ level: config.logging.level }),
      fileTransport,
      errorFileTransport,
    ],
    exceptionHandlers: [
      new transports.File({
        filename: path.join(logDir, `${serviceName}-exceptions.log`),
      }),
    ],
    rejectionHandlers: [
      new transports.File({
        filename: path.join(logDir, `${serviceName}-rejections.log`),
      }),
    ],
  });
};

// Default logger (used before service name is known)
const logger = createServiceLogger("app");

module.exports = { logger, createServiceLogger };
