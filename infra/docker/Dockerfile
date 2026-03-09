# For all Node services

# ---- Base image ----
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache tini
# Use tini as PID 1 for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# ---- Dependencies ----
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ---- Final image ----
FROM base AS final
ENV NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

# Default command (override in docker-compose per service)
CMD ["node", "gateway/index.js"]