# ==========================================
# Stage 1: Build Angular Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Python Backend with FFmpeg
# ==========================================
FROM python:3.11-slim

# Install system dependencies (FFmpeg is required for video merging & audio stripping)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python requirements
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source
COPY backend/app/ ./app/

# Copy built Angular frontend assets from Stage 1
COPY --from=frontend-builder /app/frontend/dist/frontend/browser ./static/

# Render automatically sets $PORT at runtime (defaults to 10000)
ENV PORT=10000
EXPOSE 10000

# Start Uvicorn bound to 0.0.0.0 and dynamic $PORT
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}"]
