# Production Dockerfile for IGRID Project Management Dashboard
FROM node:18-alpine

WORKDIR /app

# Install build dependencies for sqlite3 if needed
RUN apk add --no-cache python3 make g++

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY . .

# Run build verification
RUN npm run build

# Expose server port
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV ENABLE_NGROK=false

# Start server
CMD ["node", "server.js"]
