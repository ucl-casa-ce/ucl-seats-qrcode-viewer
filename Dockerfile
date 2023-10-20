# Use Alpine (a lightweight linux image)
FROM alpine

# Install node and npm for later use
RUN apk add --update nodejs npm

# Create app directory - can be anywhere you like on the internal container filesystem
WORKDIR /usr/src/app

# Copy all files in our development folder over to the container
COPY . .

# Change folder to the node folder before installing modules
WORKDIR /usr/src/app/

# Install module dependencies
RUN npm install
RUN npm ci --only=production

# Export the port we defined within the container
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=60s --retries=5 \
CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Run the node application
CMD [ "node", "server.js" ]
