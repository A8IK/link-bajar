# syntax=docker/dockerfile:1.6
FROM node:20-alpine AS deps
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY backend/ .
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 \
 && chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1
CMD ["node", "src/server.js"]
