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

# Install all dependencies (including dev deps needed for build)
RUN npm ci && \
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

# Firebase configuration build arguments
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID

ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=$NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID

# Environment variables will be provided at runtime via Cloud Run
ENV SKIP_ENV_VALIDATION=true
RUN npm run build

# Create production dependencies stage
FROM node:20-slim AS production-deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# Use distroless image for minimal attack surface in production
FROM gcr.io/distroless/nodejs20-debian12 AS run

# Set up non-root user (distroless images have nonroot user built-in)
USER nonroot

WORKDIR /app

ENV NODE_ENV=production \
    PORT=8080 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

# Static assets and server
COPY --chown=nonroot:nonroot --from=build /app/public ./public
COPY --chown=nonroot:nonroot --from=build /app/.next/standalone ./
COPY --chown=nonroot:nonroot --from=build /app/.next/static ./.next/static



EXPOSE 8080
CMD ["server.js"]