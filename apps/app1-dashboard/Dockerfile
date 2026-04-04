FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Serve with lightweight static server ─────────────
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN npm install -g serve && \
    addgroup -S appgroup && \
    adduser -S appuser -G appgroup

COPY --from=builder /app/dist ./dist

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 5173
CMD ["serve", "dist", "-s", "-l", "5173"]
