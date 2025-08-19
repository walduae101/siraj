FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:22-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Environment variables will be provided at runtime via Cloud Run
ENV SKIP_ENV_VALIDATION=true
RUN npm run build

FROM node:22-slim AS run
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