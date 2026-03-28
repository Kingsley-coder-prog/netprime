"use strict";

/**
 * server.js — Monolith mode entry point
 * Starts all microservices in a single process for free tier deployment.
 * Each service still runs on its own port and the gateway proxies between them.
 * This is not recommended for production but allows us to deploy on platforms like Render's free tier without needing multiple services or a container orchestration system.
 *
 * Usage: node server.js
 */

const { spawn } = require("child_process");
const path = require("path");

const services = [
  { name: "auth", script: "services/auth-service/index.js", port: 3001 },
  { name: "user", script: "services/user-service/index.js", port: 3002 },
  { name: "movie", script: "services/movie-service/index.js", port: 3003 },
  { name: "stream", script: "services/stream-service/index.js", port: 3004 },
  { name: "upload", script: "services/upload-service/index.js", port: 3005 },
  {
    name: "notification",
    script: "services/notification-service/index.js",
    port: 3006,
  },
  { name: "gateway", script: "gateway/index.js", port: 3000 },
];

const processes = [];

function startService(service) {
  const proc = spawn("node", [path.join(__dirname, service.script)], {
    env: { ...process.env },
    stdio: ["ignore", "pipe", "pipe"],
  });

  proc.stdout.on("data", (data) => {
    process.stdout.write(`[${service.name}] ${data}`);
  });

  proc.stderr.on("data", (data) => {
    process.stderr.write(`[${service.name}] ${data}`);
  });

  proc.on("exit", (code, signal) => {
    if (signal !== "SIGTERM" && signal !== "SIGINT") {
      console.log(
        `[${service.name}] exited with code ${code}, restarting in 3s...`,
      );
      setTimeout(() => startService(service), 3000);
    }
  });

  processes.push({ service, proc });
  console.log(`[server] Started ${service.name} on port ${service.port}`);
  return proc;
}

// Start all services
console.log("[server] Starting all Netprime services...");
services.forEach(startService);

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`[server] ${signal} received — shutting down all services...`);
  processes.forEach(({ service, proc }) => {
    console.log(`[server] Stopping ${service.name}...`);
    proc.kill("SIGTERM");
  });
  setTimeout(() => process.exit(0), 5000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
