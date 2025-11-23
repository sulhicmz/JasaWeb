# Multi-stage build for security and optimization
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm@8.15.0

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages ./packages

# Install dependencies
FROM base AS dependencies
RUN pnpm install --frozen-lockfile --prod

# Build stage
FROM base AS build
RUN pnpm install --frozen-lockfile
COPY apps/web ./apps/web
RUN cd apps/web && pnpm build

# Production stage
FROM node:20-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S astro -u 1001

# Set working directory
WORKDIR /app

# Copy only necessary files from previous stages
COPY --from=dependencies --chown=astro:nodejs /app/node_modules ./node_modules
COPY --from=dependencies --chown=astro:nodejs /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=build --chown=astro:nodejs /app/apps/web/dist ./apps/web/dist
COPY --from=build --chown=astro:nodejs /app/apps/web/package.json ./apps/web/

# Security: Remove unnecessary packages and files
RUN apk del --purge apk-tools && \
    rm -rf /var/cache/apk/* /tmp/* /var/tmp/*

# Switch to non-root user
USER astro

# Expose port
EXPOSE 4321

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4321', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "apps/web/dist/server/entry.mjs"]
