# Single-stage build — all dependencies kept so vite is resolvable at runtime
# (esbuild bundles the vite import path even though it is guarded by NODE_ENV check)
FROM node:22-alpine

# Use corepack (built into Node 22) — no npm install -g pnpm needed
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

WORKDIR /app

# Copy package files first for Docker layer caching
COPY package.json pnpm-lock.yaml* ./
COPY patches/ ./patches/

# Install ALL dependencies (dev + prod) so vite package is present at runtime
RUN pnpm install --frozen-lockfile

# Copy full source code
COPY . .

# Build frontend (Vite) + backend (esbuild) + copy data files
RUN pnpm build

ENV NODE_ENV=production

# Railway injects $PORT; the app reads process.env.PORT automatically
EXPOSE 3000

CMD ["node", "dist/index.js"]
