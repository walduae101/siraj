# syntax=docker/dockerfile:1
FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Enable pnpm and install ALL dependencies (including devDependencies for build)
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate && pnpm fetch

# Copy source code
COPY . .

# Install all dependencies (including devDependencies for build)
RUN pnpm install --offline

# Build the application (NODE_ENV will be set by Next.js)
RUN pnpm build

# Remove devDependencies after build
RUN pnpm prune --prod

# Set production environment after build
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Start the application
CMD ["pnpm", "start"]