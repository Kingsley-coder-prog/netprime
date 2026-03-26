# backend/infra/docker/Dockerfile
# Used for all Node.js microservices (gateway, auth, movie, upload, stream, user, notification)

# ---- Base ----
FROM node:20-alpine AS base
WORKDIR /app
# tini handles signals properly (zombie process prevention)
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

# ---- Dependencies ----
FROM base AS deps
COPY package*.json ./
# Install only production deps, skip devDependencies
RUN npm ci --only=production && npm cache clean --force

# ---- Final image ----
FROM base AS final
ENV NODE_ENV=production

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

# Copy production node_modules from deps stage
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
# Copy application code
COPY --chown=nodejs:nodejs . .

# Expose no port by default — each service overrides in docker-compose
EXPOSE 3000

# Default: gateway. Override CMD in docker-compose per service
CMD ["node", "gateway/index.js"]