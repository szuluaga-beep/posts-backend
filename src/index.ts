import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import postsRouter from './routes/posts';
import { errorHandler } from './middleware/errorHandler';
import metricsMiddleware from './middleware/metricsMiddleware';
import { 
  getMetrics, 
  getMetricsContentType, 
  mongooseConnectionStatus,
  dbQueryDuration
} from './metrics/prometheus';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Middleware Global
// ============================================

// Middleware de CORS
app.use(cors());

// Middleware de parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Middleware de métricas de Prometheus
app.use(metricsMiddleware);

// ============================================
// Rutas principales
// ============================================

// Root endpoint
app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'Posts API - Express + TypeScript + MongoDB with Prometheus Monitoring',
        version: '1.0.0',
        endpoints: {
            posts: '/api/posts',
            health: '/health',
            metrics: '/metrics'
        },
        monitoring: {
            prometheus: 'http://localhost:9090',
            grafana: 'http://localhost:3001',
            alertmanager: 'http://localhost:9093'
        }
    });
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
    const dbStatus = await mongooseConnectionStatus.get();
    const status = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: (dbStatus.values[0]?.value === 1) ? 'connected' : 'disconnected',
        memory: {
            used: process.memoryUsage().heapUsed / 1024 / 1024,
            total: process.memoryUsage().heapTotal / 1024 / 1024
        }
    };
    res.json(status);
});

// Métricas endpoint para Prometheus
app.get('/metrics', async (req: Request, res: Response) => {
    try {
        const metrics = await getMetrics();
        res.set('Content-Type', getMetricsContentType());
        res.end(metrics);
    } catch (error) {
        res.status(500).end(`Error: ${error}`);
    }
});

// Posts API routes
app.use('/api/posts', postsRouter);

// ============================================
// Error handling (must be before 404)
// ============================================

app.use(errorHandler);

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// ============================================
// Iniciar servidor
// ============================================

const startServer = async () => {
    try {
        // Connect to database
        await connectDatabase();
        
        // Marcar MongoDB como conectado
        mongooseConnectionStatus.set(1);

        // Start listening
        app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════════╗
║     Posts API - Servidor en funcionamiento║
╠════════════════════════════════════════════╣
║ 🚀 API: http://localhost:${PORT}
║ 📊 Métricas: http://localhost:${PORT}/metrics
║ 💚 Health: http://localhost:${PORT}/health
║ 📈 Prometheus: http://localhost:9090
║ 📊 Grafana: http://localhost:3001
║ 🔔 Alertmanager: http://localhost:9093
╚════════════════════════════════════════════╝
            `);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        mongooseConnectionStatus.set(0);
        process.exit(1);
    }
};

startServer();

