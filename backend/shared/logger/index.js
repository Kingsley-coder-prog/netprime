"use strict";

// backend/shared/logger/index.js

const { createLogger, format, transports } = require("winston");
const path = require("path");
const config = require("../../config");

const { combine, timestamp, errors, json, colorize, printf } = format;

const devFormat = combine(
  colorize(),
  timestamp({ format: "HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, service, stack }) => {
    const svc = service ? `[${service}]` : "";
    return `${timestamp} ${level} ${svc} ${stack || message}`;
  }),
);

const prodFormat = combine(timestamp(), errors({ stack: true }), json());

const createServiceLogger = (serviceName) => {
  const safeServiceName = serviceName.replace(/[:<>"\/\|?*]/g, "-");

  // In production/containers — console only (stdout/stderr)
  // Railway, Render, Docker all capture console output automatically
  // File logging only in local development
  const loggerTransports = [
    new transports.Console({ level: config.logging.level }),
  ];

  const exceptionHandlers = [new transports.Console()];

  const rejectionHandlers = [new transports.Console()];

  // Only add file transports in development
  if (config.isDev) {
    try {
      require("winston-daily-rotate-file");
      const logDir = path.resolve(config.logging.dir);
      const fs = require("fs");

      // Create log directory if it doesn't exist
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      loggerTransports.push(
        new (require("winston-daily-rotate-file"))({
          dirname: logDir,
          filename: `${safeServiceName}-%DATE%.log`,
          datePattern: "YYYY-MM-DD",
          zippedArchive: true,
          maxSize: "20m",
          maxFiles: "14d",
          level: config.logging.level,
        }),
        new (require("winston-daily-rotate-file"))({
          dirname: logDir,
          filename: `${safeServiceName}-error-%DATE%.log`,
          datePattern: "YYYY-MM-DD",
          zippedArchive: true,
          maxSize: "20m",
          maxFiles: "30d",
          level: "error",
        }),
      );

      exceptionHandlers.push(
        new (require("winston-daily-rotate-file"))({
          dirname: logDir,
          filename: `${safeServiceName}-exceptions-%DATE%.log`,
          datePattern: "YYYY-MM-DD",
        }),
      );

      rejectionHandlers.push(
        new (require("winston-daily-rotate-file"))({
          dirname: logDir,
          filename: `${safeServiceName}-rejections-%DATE%.log`,
          datePattern: "YYYY-MM-DD",
        }),
      );
    } catch (err) {
      // winston-daily-rotate-file not available — console only
    }
  }

  return createLogger({
    defaultMeta: { service: serviceName },
    format: config.isDev ? devFormat : prodFormat,
    transports: loggerTransports,
    exceptionHandlers,
    rejectionHandlers,
  });
};

const logger = createServiceLogger("app");

module.exports = { logger, createServiceLogger };
