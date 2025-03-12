# Use an official Node.js runtime as the base image
FROM node:18-alpine3.16

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the application code
COPY . .

# Expose the port
EXPOSE 3000 9229

# Start the application
CMD ["npm", "start"]