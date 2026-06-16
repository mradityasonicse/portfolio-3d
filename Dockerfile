# Stage 1: Build admin React SPA
FROM node:20-alpine AS admin-builder
WORKDIR /admin
COPY admin/package.json admin/package-lock.json* ./
RUN npm ci
COPY admin/ .
RUN npm run build

# Stage 2: Production Node.js server
FROM node:20-alpine
WORKDIR /app

# Install build tools for better-sqlite3 native module
RUN apk add --no-cache python3 make g++

# Copy Node.js deps
COPY package.json package-lock.json* ./
RUN npm ci --production

# Copy server code
COPY server/ ./server/

# Copy built admin SPA
COPY --from=admin-builder /admin/dist ./admin/dist

# Copy static files (existing portfolio site)
COPY *.html *.css *.js *.png *.jpg *.jpeg *.webp *.ico *.txt ./

# Create uploads and backups dirs
RUN mkdir -p uploads backups

EXPOSE 3000
CMD ["node", "server/index.js"]
