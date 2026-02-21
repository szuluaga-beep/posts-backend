import { Request, Response, NextFunction } from 'express';
import {
  httpRequestDuration,
  httpRequestsTotal,
  httpRequestErrors
} from '../metrics/prometheus';

/**
 * Middleware para registrar métricas de requests HTTP
 * Registra duración, total de requests y errores
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Guardar referencia al método original
  const originalEnd = res.end.bind(res);
  
  // Interceptar el método end() de response
  res.end = function(this: Response, chunk?: any, encoding?: BufferEncoding | (() => void), cb?: () => void): Response {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    // Registrar métrica de duración
    httpRequestDuration
      .labels(req.method, route)
      .observe(duration);
    
    // Registrar métrica de total
    httpRequestsTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc();
    
    // Si el status code indica error, registrar también como error
    if (res.statusCode >= 400) {
      const errorType = res.statusCode >= 500 ? 'server_error' : 'client_error';
      httpRequestErrors
        .labels(req.method, route, errorType)
        .inc();
    }
    
    // Llamar al método original con los argumentos correctos
    if (typeof encoding === 'function') {
      return originalEnd(chunk, encoding);
    }
    if (encoding) {
      return originalEnd(chunk, encoding, cb);
    }
    return originalEnd(chunk);
  };
  
  next();
};

export default metricsMiddleware;
