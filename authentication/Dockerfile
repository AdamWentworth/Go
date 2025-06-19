# Use the official lightweight Node.js 18 Alpine base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy only package files first to leverage Docker caching for dependencies
COPY package*.json ./

# Install only production dependencies (no dev dependencies)
RUN npm install --only=production

# Copy the rest of your app's source code
COPY . .

# Set environment variable inside the container
ENV NODE_ENV=production

# Expose port 3002 (your app runs on this port internally)
EXPOSE 3002

# Define the default command to start your Node.js app
CMD ["node", "app.js"]
