# ============================================
# Stage 1 : Build — Environnement de compilation
# ============================================
FROM node:20-alpine3.21 AS build
WORKDIR /app

COPY package*.json tsconfig.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-fund --no-audit

COPY src/ ./src/

RUN npm run build

# ============================================
# Stage 2 : Deps — Installation prod uniquement
# ============================================
FROM node:20-alpine3.21 AS deps
WORKDIR /app

COPY --from=build /app/package*.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --no-fund --no-audit

# ============================================
# Stage 3 : Runtime — Distroless (zéro shell, zéro vulnérabilité OS)
# ============================================
FROM gcr.io/distroless/nodejs20-debian12 AS runtime
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 8080
ENV APP_ENV=production
ENV NODE_ENV=production
# distroless tourne en nonroot (uid 65532) par défaut
USER nonroot
CMD ["dist/index.js"]
