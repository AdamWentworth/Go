# pokemon_data dockerfile

# Use Node.js LTS base image
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy dependency files first for layer caching
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy the rest of the app
COPY . .

# Copy production environment
ENV NODE_ENV=production

# Ensure SQLite file is accessible and writable
RUN mkdir -p ./data && chmod -R 755 ./data

# Expose port (matches config or .env)
EXPOSE 3001

# Start the application
CMD ["node", "server.js"]
