# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.20.0

################################################################################
# Base stage - Set up working directory
################################################################################
FROM node:${NODE_VERSION}-alpine AS base

WORKDIR /usr/src/app

################################################################################
# Dependencies stage - Install production dependencies only
################################################################################
FROM base AS deps

# Use cache mounts to speed up dependency installation
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,id=npm-cache-deps,target=/root/.npm \
    npm ci --omit=dev

################################################################################
# Build stage - Install all dependencies and build TypeScript
################################################################################
FROM base AS build

# Install all dependencies (including devDependencies for TypeScript compilation)
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,id=npm-cache-build,target=/root/.npm \
    npm ci

# Copy source code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

################################################################################
# Final stage - Production-ready image
################################################################################
FROM base AS final

# Set production environment
ENV NODE_ENV=production

# Run as non-root user for security
USER node

# Copy package.json for reference
COPY package.json .

# Copy production dependencies from deps stage
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Copy compiled application from build stage
COPY --from=build /usr/src/app/dist ./dist

# Expose application port
EXPOSE 3000

# Start the application
CMD ["node", "./dist/index.js"]