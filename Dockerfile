# Stage 1: Build admin React SPA
FROM node:20-alpine AS admin-builder
WORKDIR /admin
COPY admin/package.json ./
COPY admin/package-lock.json ./
RUN npm install
COPY admin/ .
RUN npm run build

# Stage 2: Production Node.js server
FROM node:20-alpine

WORKDIR /app

# Install build tools for better-sqlite3 native module
RUN apk add --no-cache python3 make g++

# Copy Node.js deps and install
COPY package.json ./
COPY package-lock.json ./
RUN npm install --production

# Copy server code
COPY server/ ./server/

# Copy built admin SPA
COPY --from=admin-builder /admin/dist ./admin/dist

# Copy ALL static files from root directory
COPY *.html ./
COPY *.css ./
COPY *.js ./
COPY *.png ./
COPY *.jpg ./
COPY *.jpeg ./
COPY *.webp ./
COPY *.txt ./

# Create required directories
RUN mkdir -p uploads backups

EXPOSE 3000

CMD ["node", "server/index.js"]
