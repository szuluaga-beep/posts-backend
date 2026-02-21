import * as promClient from 'prom-client';

// ============================================
// Configuración de Prometheus Client
// ============================================

// Crear registro por defecto
const register = promClient.register;

// ============================================
// Métricas de Gauge (valor que puede subir y bajar)
// ============================================

export const cpuUsage = new promClient.Gauge({
  name: 'app_cpu_usage_percent',
  help: 'Uso de CPU en porcentaje',
  registers: [register]
});

export const memoryUsage = new promClient.Gauge({
  name: 'app_memory_usage_bytes',
  help: 'Uso de memoria en bytes',
  registers: [register]
});

export const activeConnections = new promClient.Gauge({
  name: 'app_active_connections',
  help: 'Número de conexiones activas',
  registers: [register]
});

// ============================================
// Métricas de Counter (solo aumenta)
// ============================================

export const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total de requests HTTP',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

export const httpRequestErrors = new promClient.Counter({
  name: 'http_request_errors_total',
  help: 'Total de errores en requests HTTP',
  labelNames: ['method', 'route', 'error_type'],
  registers: [register]
});

// ============================================
// Métricas de Histogram (distribución de valores)
// ============================================

export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duración de requests HTTP en segundos',
  labelNames: ['method', 'route'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

export const dbQueryDuration = new promClient.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duración de queries a BD en segundos',
  labelNames: ['operation', 'collection'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
  registers: [register]
});

// ============================================
// Métricas adicionales
// ============================================

export const cacheHitRatio = new promClient.Gauge({
  name: 'cache_hit_ratio',
  help: 'Ratio de hits en cache',
  registers: [register]
});

export const mongooseConnectionStatus = new promClient.Gauge({
  name: 'mongoose_connection_status',
  help: 'Estado de la conexión a MongoDB (1=connected, 0=disconnected)',
  registers: [register]
});

// ============================================
// Exportar registro y función para obtener métricas
// ============================================

// Actualizar métricas del sistema
export const updateSystemMetrics = () => {
  const memUsage = process.memoryUsage();
  memoryUsage.set(memUsage.heapUsed);
  
  // Simular CPU (en producción usarías os.cpus() o bibliotecas especializadas)
  cpuUsage.set(Math.random() * 100);
  
  // Simular conexiones activas
  activeConnections.set(Math.floor(Math.random() * 50));
  
  // Simular ratio de cache
  cacheHitRatio.set(0.75 + Math.random() * 0.2);
};

// Obtener todas las métricas en formato Prometheus
export const getMetrics = async () => {
  updateSystemMetrics();
  return await register.metrics();
};

// Obtener el content-type
export const getMetricsContentType = () => register.contentType;

export default {
  cpuUsage,
  memoryUsage,
  activeConnections,
  httpRequestsTotal,
  httpRequestErrors,
  httpRequestDuration,
  dbQueryDuration,
  cacheHitRatio,
  mongooseConnectionStatus,
  updateSystemMetrics,
  getMetrics,
  getMetricsContentType,
  register
};
