# ---------- build ----------
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV SKIP_ENV_VALIDATION=true
RUN npm run build

# ---------- run ----------
FROM gcr.io/distroless/nodejs20-debian12
WORKDIR /app
# Next standalone output
COPY --from=build /app/.next/standalone ./
# Static assets + public files (must be sibling paths)
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
ENV NODE_ENV=production PORT=8080 HOSTNAME=0.0.0.0
EXPOSE 8080
CMD ["server.js"]