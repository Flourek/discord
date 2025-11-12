# Use the official Node.js LTS image
FROM node:20-bullseye-slim

# Set working directory inside the container
WORKDIR /app

# Copy package files first (for better layer caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the project files
COPY . .

# Expose the port your app runs on (optional, e.g. 3000)
EXPOSE 4000

# Define the default command
CMD ["npm", "start"]
