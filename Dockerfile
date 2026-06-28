# ── Stage 1: Install all dependencies and generate Prisma client ──────────────
FROM node:20-slim AS deps
WORKDIR /app

# openssl is needed by Prisma on Debian-based images
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --legacy-peer-deps
RUN npx prisma generate


# ── Stage 2: Compile TypeScript ───────────────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build


# ── Stage 3: Production image ─────────────────────────────────────────────────
FROM node:20-slim AS production
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# All node_modules kept: prisma CLI + ts-node are used at startup for
# migrations and seeding before the compiled server starts
COPY --from=deps /app/node_modules ./node_modules

# Compiled NestJS app
COPY --from=builder /app/dist ./dist

# Prisma schema, migrations, and TypeScript seed scripts
COPY prisma ./prisma/

# tsconfig.json is needed by ts-node when running the seed
COPY tsconfig.json ./
COPY package.json ./

EXPOSE 4000

# Startup order: migrate DB → seed → start server
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/main.js"]
