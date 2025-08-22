# Use latest Node.js 22 slim image based on Debian
FROM node:22-slim AS deps

# Update all packages to latest security patches
# This addresses security scanner concerns including CVE-2023-45853
RUN apt-get update && apt-get upgrade -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:22-slim AS build

# Update packages in build stage as well
RUN apt-get update && apt-get upgrade -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Environment variables will be provided at runtime via Cloud Run
ENV SKIP_ENV_VALIDATION=true
RUN npm run build

FROM node:22-slim AS run

# Update packages in runtime stage for security
RUN apt-get update && apt-get upgrade -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV SKIP_ENV_VALIDATION=true
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
EXPOSE 8080
CMD ["npm","start","--","--port","8080"]