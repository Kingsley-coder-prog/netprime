"use strict";

const Redis = require("ioredis");
const config = require("../../config");
const { createServiceLogger } = require("../logger");

const logger = createServiceLogger("redis");

let client = null;

const createRedisClient = () => {
  if (client) return client;

  const isLocalRedis = ["localhost", "127.0.0.1"].includes(config.redis.host);
  const useTLS = !isLocalRedis && !!config.redis.password;

  const redisOptions = {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    retryStrategy: config.redis.retryStrategy,
    enableOfflineQueue: true,
    maxRetriesPerRequest: 3,
    lazyConnect: false,
  };

  if (useTLS) {
    redisOptions.tls = {};
  }

  client = new Redis(redisOptions);

  client.on("connect", () => logger.info("Redis connected."));
  client.on("ready", () => logger.info("Redis ready."));
  client.on("error", (err) => logger.error("Redis error:", err));
  client.on("close", () => logger.warn("Redis connection closed."));
  client.on("reconnecting", (ms) =>
    logger.warn(`Redis reconnecting in ${ms}ms...`),
  );

  return client;
};

const getRedisClient = () => {
  if (!client) createRedisClient();
  return client;
};

const disconnectRedis = async () => {
  if (client) {
    await client.quit();
    client = null;
    logger.info("Redis connection closed.");
  }
};

module.exports = { getRedisClient, disconnectRedis };
