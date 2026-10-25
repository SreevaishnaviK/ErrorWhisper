# Multi-stage production Dockerfile for ErrorWhisper on Google Cloud Run
# Stage 1: Build frontend assets
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm ci || npm install

# Copy application source files
COPY . .

# Build the client SPA into dist/
RUN npm run build

# Stage 2: Production lightweight runner
FROM node:22-alpine AS runner

WORKDIR /app

# Production environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts || npm install --omit=dev

# Copy compiled frontend assets from builder stage
COPY --from=builder /app/dist ./dist

# Copy server entry point
COPY --from=builder /app/server.ts ./server.ts

# Cloud Run injects $PORT at runtime (defaults to 3000 locally)
EXPOSE 3000

# Start production server with Node 22 (runs server.ts directly on 0.0.0.0:$PORT)
CMD ["node", "server.ts"]
