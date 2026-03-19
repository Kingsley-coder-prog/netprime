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
const {
  authenticate,
  optionalAuthenticate,
} = require("./middleware/gatewayAuth");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("../swagger");

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

// ---- Swagger UI ----
const swaggerCustomCss = `
  body { background-color: #0f0f1a; }
  .swagger-ui { color: #e0e0e0; font-size: 15px; font-family: 'Segoe UI', Arial, sans-serif; }
  .swagger-ui .topbar { background-color: #1a1a2e; padding: 12px 0; border-bottom: 2px solid #e94560; }
  .swagger-ui .topbar .download-url-wrapper { display: none; }
  .swagger-ui .topbar-wrapper .link { content: 'Netprime API'; }
  .swagger-ui .info { margin: 30px 0; }
  .swagger-ui .info .title { color: #e94560; font-size: 32px; font-weight: 700; }
  .swagger-ui .info p, .swagger-ui .info li, .swagger-ui .info td { color: #b0b0c0; font-size: 14px; }
  .swagger-ui .info a { color: #e94560; }
  .swagger-ui .info table th { color: #e0e0e0; background: #1a1a2e; }
  .swagger-ui .info table td { color: #b0b0c0; }
  .swagger-ui .scheme-container { background: #1a1a2e; padding: 15px; border-radius: 8px; box-shadow: none; }
  .swagger-ui select { background: #1a1a2e; color: #e0e0e0; border: 1px solid #333; }
  .swagger-ui .opblock-tag { color: #e0e0e0; font-size: 18px; border-bottom: 1px solid #2a2a3e; }
  .swagger-ui .opblock-tag:hover { background: #1a1a2e; }
  .swagger-ui .opblock { border-radius: 8px; margin: 8px 0; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
  .swagger-ui .opblock .opblock-summary { border-radius: 8px; }
  .swagger-ui .opblock.opblock-get { background: rgba(97,175,254,0.08); border-color: #61afef; }
  .swagger-ui .opblock.opblock-get .opblock-summary { border-color: #61afef; }
  .swagger-ui .opblock.opblock-post { background: rgba(73,204,144,0.08); border-color: #49cc90; }
  .swagger-ui .opblock.opblock-post .opblock-summary { border-color: #49cc90; }
  .swagger-ui .opblock.opblock-patch { background: rgba(80,227,194,0.08); border-color: #50e3c2; }
  .swagger-ui .opblock.opblock-patch .opblock-summary { border-color: #50e3c2; }
  .swagger-ui .opblock.opblock-delete { background: rgba(249,62,62,0.08); border-color: #f93e3e; }
  .swagger-ui .opblock.opblock-delete .opblock-summary { border-color: #f93e3e; }
  .swagger-ui .opblock-summary-method { border-radius: 4px; font-size: 13px; min-width: 70px; }
  .swagger-ui .opblock-summary-path { color: #e0e0e0; font-size: 14px; }
  .swagger-ui .opblock-summary-description { color: #9090a0; font-size: 13px; }
  .swagger-ui .opblock-body { background: #12121f; }
  .swagger-ui .opblock-description-wrapper p { color: #b0b0c0; }
  .swagger-ui textarea, .swagger-ui input[type=text], .swagger-ui input[type=password] { background: #1a1a2e; color: #e0e0e0; border: 1px solid #3a3a5e; border-radius: 4px; font-size: 14px; }
  .swagger-ui .btn { border-radius: 4px; font-size: 13px; }
  .swagger-ui .btn.execute { background-color: #e94560; border-color: #e94560; }
  .swagger-ui .btn.execute:hover { background-color: #c73652; }
  .swagger-ui .btn.authorize { color: #49cc90; border-color: #49cc90; }
  .swagger-ui .btn.authorize svg { fill: #49cc90; }
  .swagger-ui .responses-wrapper { background: #12121f; }
  .swagger-ui .response-col_status { color: #e0e0e0; }
  .swagger-ui table thead tr th { background: #1a1a2e; color: #9090a0; font-size: 13px; }
  .swagger-ui table tbody tr td { background: #12121f; color: #b0b0c0; border-color: #2a2a3e; font-size: 13px; }
  .swagger-ui .parameter__name { color: #e0e0e0; font-size: 14px; }
  .swagger-ui .parameter__type { color: #61afef; font-size: 12px; }
  .swagger-ui .parameter__in { color: #9090a0; font-size: 11px; }
  .swagger-ui .model-box { background: #1a1a2e; }
  .swagger-ui section.models { border-color: #2a2a3e; }
  .swagger-ui section.models .model-container { background: #12121f; border-color: #2a2a3e; }
  .swagger-ui .model-title { color: #e94560; }
  .swagger-ui .prop-type { color: #61afef; }
  .swagger-ui .markdown p, .swagger-ui .markdown li { color: #b0b0c0; font-size: 14px; }
  .swagger-ui .markdown code { background: #1a1a2e; color: #e94560; padding: 2px 6px; border-radius: 3px; }
  .swagger-ui .markdown table { width: 100%; }
  .swagger-ui .highlight-code { background: #1a1a2e; }
  .swagger-ui .microlight { background: #1a1a2e !important; color: #e0e0e0 !important; font-size: 13px; }
`;

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Netprime API Docs",
    customCss: swaggerCustomCss,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
      defaultModelsExpandDepth: -1,
    },
  }),
);

// Expose raw spec as JSON
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

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
app.use("/api/movies", optionalAuthenticate, proxy(config.services.movie));
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
