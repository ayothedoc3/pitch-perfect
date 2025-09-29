# Build and run frontend + backend in a single container
FROM node:18-alpine

# Install required OS packages
RUN apk add --no-cache \
    dumb-init \
    python3 \
    make \
    g++ \
    libc6-compat \
    openssl

WORKDIR /app

# Copy package manifests first (root + workspaces)
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
COPY backend/prisma ./backend/prisma/

# Install root dependencies (includes concurrently)
RUN npm config set fetch-retry-mintimeout 20000 \`n && npm config set fetch-retry-maxtimeout 120000 \`n && npm config set fetch-retries 5 \`n && npm config set audit false \`n && npm config set fund false \`n && npm ci

# Install workspace dependencies
RUN cd backend \`n && npm ci --no-audit --fund=false \`n || (npm cache verify && npm ci --no-audit --fund=false)
RUN cd frontend \`n && npm ci --no-audit --fund=false \`n || (npm cache verify && npm ci --no-audit --fund=false)

# Copy the rest of the repository
COPY . .

# Build backend (ts -> dist) and frontend (Next.js)
RUN npm run build

# Ensure uploads directory exists for runtime storage
RUN mkdir -p backend/uploads

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    BACKEND_PORT=3011 \
    INTERNAL_API_URL=http://127.0.0.1:3011/api/:path*

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "start"]

