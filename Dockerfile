# --- Stage 1: Build Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ENV VITE_API_BASE_URL=/api
RUN npm run build

# --- Stage 2: Build Backend ---
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm ci
COPY backend/ ./
RUN npm run build

# --- Stage 3: Final Production Image ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000
ENV DATABASE_URL="file:./data/dev.db"

# Copy backend dist and node_modules
COPY --from=backend-builder /app/backend/package*.json ./backend/
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/prisma ./backend/prisma

# Copy frontend dist into backend/frontend/dist for Express static serving
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy initial database if available
COPY backend/prisma/dev.db ./backend/data/dev.db

WORKDIR /app/backend
EXPOSE 5000

CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/index.js"]
