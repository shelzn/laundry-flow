FROM oven/bun:1-alpine AS base

WORKDIR /app

RUN apk add --no-cache libc6-compat


# =========================
# Install dependencies
# =========================
FROM base AS deps

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile


# =========================
# Build application
# =========================
FROM base AS builder

WORKDIR /app

ARG DATABASE_URL

ENV DATABASE_URL=$DATABASE_URL

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN bun run build


# =========================
# Production runner
# =========================
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=5003
ENV HOSTNAME=0.0.0.0

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

USER nextjs

EXPOSE 5003

CMD ["bun", "server.js"]