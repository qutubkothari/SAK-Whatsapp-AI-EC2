# Use Puppeteer official image (already has Chrome installed)
FROM ghcr.io/puppeteer/puppeteer:21.6.1

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (skip puppeteer chromium download since it's already in the image)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
RUN npm ci --omit=dev

# Copy app source
COPY . .

# Expose port
ENV PORT=8080
EXPOSE 8080

# Run as non-root user
USER pptruser

# Start the app
CMD ["node", "index.js"]
