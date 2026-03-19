FROM node:20-bookworm-slim

# Install Python3 (required by yt-dlp to run natively in Linux)
RUN apt-get update && apt-get install -y python3 \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy package configurations
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code and uploads folder
COPY . .

# Ensure uploads directory exists and has permissions
RUN mkdir -p uploads && chmod -R 777 uploads

# Create the start port variable matching our local
ENV PORT=5001

EXPOSE 5001

# Start the Node server
CMD ["npm", "start"]
