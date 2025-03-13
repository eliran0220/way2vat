FROM node:18-alpine3.16

# Set working directory in container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the backend folder properly
COPY backend ./backend

# Set working directory inside backend
WORKDIR /app/backend

# Expose the necessary ports
EXPOSE 3000 9229

# Start the application
CMD ["npm", "start"]
