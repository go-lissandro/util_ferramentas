FROM node:20-alpine AS builder

WORKDIR /app

# Build server
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Build client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build

# ── Production image ──────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist

RUN addgroup -S appgroup && \
    adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 4001
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost:4001/health || exit 1

CMD ["node", "dist/server.js"]
