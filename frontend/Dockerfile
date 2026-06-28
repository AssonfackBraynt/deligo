# ── Stage 1: Install dependencies ─────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci


# ── Stage 2: Build Next.js app ────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* variables are baked into the JS bundle at build time.
# Pass the correct API URL here:
#   - Local Docker:  http://localhost:4000/api/v1
#   - Production:    https://api.yourdomain.com/api/v1
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build


# ── Stage 3: Production image (standalone = ~10x smaller) ─────────────────────
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
