# syntax=docker/dockerfile:1

# ---------- build stage ----------
FROM node:24.22.1-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ---------- production stage ----------
FROM node:24.22.1-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Placeholder so the server starts without credentials and can answer
# `initialize` / `tools/list` (registry introspection, CI smoke test). A real
# `-e YANDEX_METRICA_TOKEN=...` overrides it; tool calls refuse to run with it.
ENV YANDEX_METRICA_TOKEN=introspection-placeholder-not-a-key

# The official MCP registry checks this label against the server name in
# server.json and rejects an image it cannot trace back to that entry.
LABEL io.modelcontextprotocol.server.name="io.github.stufently/yandex-metrica-mcp"

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

# Run as non-root user
USER node

ENTRYPOINT ["node", "dist/index.js"]
