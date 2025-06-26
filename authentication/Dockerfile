# authentication dockerfile

# Use the official lightweight Node.js 18 Alpine base image
FROM node:18-alpine

# Set the working directory
WORKDIR /usr/src/app

# Install required packages including mongodump
RUN apk add --no-cache \
    bash \
    curl \
    mongodb-tools

# Copy package files first
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy source code
COPY . .

# Set environment variable
ENV NODE_ENV=production

# Expose port
EXPOSE 3002

# Default command
CMD ["node", "app.js"]
