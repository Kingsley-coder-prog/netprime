// MongoDB connection manager
"use strict";

const mongoose = require("mongoose");
const config = require("../../config");
const { createServiceLogger } = require("../logger");

const logger = createServiceLogger("db");

let isConnected = false;

/**
 * Connect to MongoDB. Safe to call multiple times - reuses existing connection.
 * Supports replica set via MONGO_URI (include all hosts in URI string).
 */
const connectDB = async () => {
  if (isConnected) {
    logger.debug("MongoDB already connected, reusing connection.");
    return;
  }

  try {
    mongoose.set("strictQuery", true);

    const uri =
      process.env.NODE_ENV === "test" ? config.mongo.testUri : config.mongo.uri;

    await mongoose.connect(uri, config.mongo.options);

    isConnected = true;
    logger.info(`MongoDB connected: ${mongoose.connection.host}`);

    // ---- Connection event handlers ----
    mongoose.connection.on("disconnected", () => {
      isConnected = false;
      logger.warn("MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      isConnected = true;
      logger.info("MongoDB reconnected.");
    });

    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB connection error:", err);
    });
  } catch (err) {
    logger.error("MongoDB initial connection failed:", err);
    // Exit so PM2 / K8s can restart the process
    process.exit(1);
  }
};

/**
 * Gracefully close the MongoDB connection.
 * Called on SIGTERM / SIGINT.
 */
const disconnectDB = async () => {
  if (!isConnected) return;
  try {
    await mongoose.connection.close();
    isConnected = false;
    logger.info("MongoDB connection closed gracefully.");
  } catch (err) {
    logger.error("Error closing MongoDB connection:", err);
  }
};

module.exports = { connectDB, disconnectDB };
