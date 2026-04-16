FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies with legacy peer deps support
RUN npm ci --legacy-peer-deps

# Copy entire source
COPY . .

# Build TypeScript
RUN npm run build

# Remove dev dependencies
RUN npm prune --omit=dev

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

CMD ["npm", "start"]
