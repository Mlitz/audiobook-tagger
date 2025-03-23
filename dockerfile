FROM node:20-alpine AS builder

# Create app directory for build stage
WORKDIR /build

# Copy package files
COPY package*.json ./

# Copy tsconfig.json
COPY tsconfig.json ./

# Copy source code
COPY src/ ./src/

# Install all dependencies including dev dependencies
RUN npm ci

# Build TypeScript code
RUN npm run build

# Create final image
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Temporarily modify package.json to remove the prepare script
RUN npm pkg delete scripts.prepare && \
    npm ci --omit=dev && \
    npm pkg set scripts.prepare="npm run build"

# Copy built application from builder stage
COPY --from=builder /build/dist ./dist
COPY .env-example ./.env

# Create volume for output files and logs
VOLUME ["/app/output", "/app/logs"]

# Command to run the app
ENTRYPOINT ["node", "dist/index.js"]