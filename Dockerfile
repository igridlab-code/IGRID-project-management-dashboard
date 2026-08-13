# Use Node 20 LTS Alpine image for high performance and lightweight footprint
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install build dependencies for native modules (like sqlite3)
RUN apk add --no-cache python3 make g++

# Copy package manifests
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy source code and static assets
COPY . .

# Create data directory for persistent SQLite database
RUN mkdir -p /app/data

# Expose server port
EXPOSE 3000

# Environment defaults
ENV NODE_ENV=production
ENV PORT=3000

# Start command
CMD ["npm", "start"]
