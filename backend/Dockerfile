# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies including dev dependencies for building
RUN npm ci --legacy-peer-deps

# Copy source code
COPY src ./src
COPY migrations ./migrations

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --legacy-peer-deps --omit=dev

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY migrations ./migrations

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Start application
CMD ["npm", "start"]
