# Stage 1: Build the application (install dependencies)
FROM node:22.20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

# Stage 2: Run the application
FROM node:22.20-alpine AS final
WORKDIR /app
COPY --from=build /app .
EXPOSE 3000
CMD ["node", "index.js"]
