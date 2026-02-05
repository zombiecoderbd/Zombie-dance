FROM node:20-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build
RUN npm run compile

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8001/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
ENV NODE_ENV=production
CMD ["node", "dist/backend/src/server.js"]
