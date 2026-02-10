# Start with fully-featured Node.js base image
FROM node:22.20.0 AS build

USER node

WORKDIR /home/node/app

# Copy dependency information and install all dependencies
COPY --chown=node:node package.json package-lock.json ./

RUN npm ci

# Copy source code (and all other relevant files)
COPY --chown=node:node tsconfig.json ./
COPY --chown=node:node src ./src

# Build code
RUN npm run build


# Run-time stage
FROM node:22.20.0-alpine

# Set non-root user
USER node

WORKDIR /home/node/app

# Copy dependency information and install production-only dependencies
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy results from previous stage
COPY --chown=node:node --from=build /home/node/app/dist ./dist

CMD [ "node", "dist/index.js" ]