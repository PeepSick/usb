# --- Build stage: install deps and compile Next.js ---
FROM node:22-alpine AS builder
WORKDIR /app

# Install only production deps first to maximize layer cache.
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

# Copy source and build.
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=postgres://usb:usb_secret_change_me@postgres:5432/usb
RUN npm run build

# --- Runtime stage: slim image, just the standalone build ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy the compiled output and production node_modules.
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000

# Healthcheck against the public /api/health endpoint.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

CMD ["npm", "start"]
