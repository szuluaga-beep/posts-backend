# Posts Backend API

REST API built with Express, TypeScript, and MongoDB for managing blog posts.

## Features

- ✅ Full CRUD operations for posts
- ✅ TypeScript for type safety
- ✅ MongoDB with Mongoose ODM
- ✅ Docker Compose for local MongoDB
- ✅ Input validation
- ✅ Error handling
- ✅ CORS enabled

## Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start MongoDB with Docker Compose:
```bash
docker-compose up -d
```

3. The `.env` file is already configured with:
```
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://admin:password123@localhost:27017/posts_db?authSource=admin
```

## Running the Application

### Development mode (with hot reload):
```bash
npm run dev
```

### Production build:
```bash
npm run build
npm start
```

The server will start on `http://localhost:3000`

---

## Docker Deployment

### Building the Docker Image

The project includes a multi-stage Dockerfile optimized for production:

```bash
# Build the Docker image
docker build -t posts-backend .
```

**Multi-stage build benefits:**
- **Stage 1 (deps)**: Installs only production dependencies
- **Stage 2 (build)**: Installs dev dependencies and compiles TypeScript
- **Stage 3 (final)**: Creates minimal production image with compiled code

### Running with Docker

#### Option 1: Run application container only
```bash
# Run the container
docker run -p 3000:3000 --name posts-api posts-backend
```

#### Option 2: Run with Docker Compose (Application + MongoDB)

First, update your `docker-compose.yml` to include both services:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: posts_mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
      MONGO_INITDB_DATABASE: posts_db
    volumes:
      - mongodb_data:/data/db
    networks:
      - posts_network

  app:
    build: .
    container_name: posts_api
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://admin:password123@mongodb:27017/posts_db?authSource=admin
      PORT: 3000
    depends_on:
      - mongodb
    networks:
      - posts_network

volumes:
  mongodb_data:
    driver: local

networks:
  posts_network:
    driver: bridge
```

Then run:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (deletes database data)
docker-compose down -v
```

### Docker Commands Reference

```bash
# Build image
docker build -t posts-backend .

# Run container
docker run -d -p 3000:3000 --name posts-api posts-backend

# View logs
docker logs posts-api

# Stop container
docker stop posts-api

# Remove container
docker rm posts-api

# Remove image
docker rmi posts-backend
```

## API Endpoints

### Base URL
```
http://localhost:3000/api/posts
```

### Endpoints

#### 1. Create a Post
```http
POST /api/posts
Content-Type: application/json

{
  "title": "My First Post",
  "content": "This is the content of my first post",
  "author": "John Doe"
}
```

#### 2. Get All Posts
```http
GET /api/posts
```

#### 3. Get Post by ID
```http
GET /api/posts/:id
```

#### 4. Update a Post
```http
PUT /api/posts/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content",
  "author": "Jane Doe"
}
```

#### 5. Delete a Post
```http
DELETE /api/posts/:id
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "Post Title",
    "content": "Post content",
    "author": "Author Name",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts       # MongoDB connection
│   ├── models/
│   │   └── Post.ts           # Post schema and model
│   ├── routes/
│   │   └── posts.ts          # CRUD routes
│   ├── middleware/
│   │   └── errorHandler.ts  # Error handling
│   └── index.ts              # App entry point
├── docker-compose.yml        # MongoDB container
├── tsconfig.json            # TypeScript config
├── package.json
└── .env                     # Environment variables
```

## Docker Commands

Start MongoDB:
```bash
docker-compose up -d
```

Stop MongoDB:
```bash
docker-compose down
```

View MongoDB logs:
```bash
docker-compose logs -f mongodb
```

Remove MongoDB data volume:
```bash
docker-compose down -v
```

## Development

The application uses:
- **Express** - Web framework
- **TypeScript** - Type safety
- **Mongoose** - MongoDB ODM
- **dotenv** - Environment variables
- **cors** - CORS support
- **nodemon** - Hot reload in development

## License

ISC
