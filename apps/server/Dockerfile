# Build context: repo root (npm workspaces share one lockfile).
FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
RUN npm ci -w apps/server --include-workspace-root=false

COPY apps/server apps/server
WORKDIR /app/apps/server
RUN npx prisma generate

EXPOSE 4000
# Apply pending migrations, then start. Seed once with: docker compose exec server npx prisma db seed
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
