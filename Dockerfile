# Use the Node official image
# https://hub.docker.com/_/node
FROM node:lts

# Specify the variable you need
ARG MONGO_PUBLIC_URL
# Use the variable
RUN echo $MONGO_PUBLIC_URL

# Create and change to the app directory.
WORKDIR /app

# Copy local code to the container image
COPY . ./

# Install packages
RUN npm ci

# Serve the app
CMD [ "node", "dist/app.js" ]