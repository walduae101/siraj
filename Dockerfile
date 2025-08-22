# Use latest Node.js 20 LTS slim image (more stable and secure than 22)
FROM node:20-slim AS deps

# Install security updates and remove unnecessary packages
# This addresses multiple CVEs including false positives
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* && \
    # Remove unnecessary user accounts
    deluser --remove-home games 2>/dev/null || true && \
    deluser --remove-home news 2>/dev/null || true && \
    # Harden file permissions
    chmod 700 /root && \
    # Remove setuid/setgid binaries we don't need
    find / -xdev -type f -perm /6000 -exec chmod a-s {} \; 2>/dev/null || true

# Create non-root user for running the app
RUN groupadd -r nodejs && useradd -r -g nodejs -s /bin/false nodejs

WORKDIR /app

# Copy package files with proper ownership
COPY --chown=nodejs:nodejs package.json package-lock.json* ./

# Install dependencies with security audit
RUN npm ci --omit=dev && \
    npm cache clean --force && \
    # Remove npm package that we don't need in production
    rm -rf /usr/local/lib/node_modules/npm

FROM node:20-slim AS build

# Security hardening for build stage
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Create non-root user
RUN groupadd -r nodejs && useradd -r -g nodejs -s /bin/false nodejs

WORKDIR /app

# Copy with proper ownership
COPY --chown=nodejs:nodejs --from=deps /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

# Create .next directory with proper permissions before switching user
RUN mkdir -p .next && chown -R nodejs:nodejs /app

# Switch to non-root user for build
USER nodejs

# Environment variables will be provided at runtime via Cloud Run
ENV SKIP_ENV_VALIDATION=true
RUN npm run build

# Use distroless image for minimal attack surface in production
FROM gcr.io/distroless/nodejs20-debian12 AS run

# Set up non-root user (distroless images have nonroot user built-in)
USER nonroot

WORKDIR /app

# Copy only necessary files with proper ownership
COPY --from=build --chown=nonroot:nonroot /app/.next ./.next
COPY --from=build --chown=nonroot:nonroot /app/public ./public
COPY --from=build --chown=nonroot:nonroot /app/package.json ./
COPY --from=build --chown=nonroot:nonroot /app/node_modules ./node_modules

# Environment setup
ENV NODE_ENV=production
ENV PORT=8080
ENV SKIP_ENV_VALIDATION=true

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD ["/nodejs/bin/node", "-e", "require('http').get('http://localhost:8080/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"]

EXPOSE 8080

# Use array form to avoid shell injection
ENTRYPOINT ["/nodejs/bin/node"]
CMD ["node_modules/.bin/next", "start", "--port", "8080"]