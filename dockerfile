FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy app source
COPY dist/ ./dist/
COPY .env-example ./.env

# Create volume for output files and logs
VOLUME ["/app/output", "/app/logs"]

# Command to run the app
ENTRYPOINT ["node", "dist/index.js"]
