# CuraVIP Backend MCP - High-Performance Node.js 22 Environment
# Supports native node:sqlite, Qloo Taste Graph grounding, and MCP SSE protocol

FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies and build TypeScript
COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/app/data/curavip.db

# Create persistent storage directory for SQLite vault and assign to non-root node user
RUN mkdir -p /app/data && chown -R node:node /app

COPY package*.json ./
RUN npm install --omit=dev
# Copy compiled JavaScript output
COPY --from=builder /app/dist ./dist

# Mount persistent data directory for SQLite vault
VOLUME ["/app/data"]

USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

CMD ["node", "dist/server.js"]
