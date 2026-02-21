# Queries PromQL Avanzadas para Análisis de Performance

## Tabla de Contenidos
1. [Latencia y Duración](#latencia-y-duración)
2. [Tasa de Error y Confiabilidad](#tasa-de-error-y-confiabilidad)
3. [Análisis por Endpoint](#análisis-por-endpoint)
4. [Análisis de Recursos](#análisis-de-recursos)
5. [Análisis de Base de Datos](#análisis-de-base-de-datos)
6. [Predicciones y Tendencias](#predicciones-y-tendencias)

---

## Latencia y Duración

### Percentiles de Latencia (Detallado)

```promql
# P50 (Mediana)
histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[1m]))

# P75
histogram_quantile(0.75, rate(http_request_duration_seconds_bucket[1m]))

# P90
histogram_quantile(0.90, rate(http_request_duration_seconds_bucket[1m]))

# P95
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[1m]))

# P99
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[1m]))

# P999 (Outliers)
histogram_quantile(0.999, rate(http_request_duration_seconds_bucket[1m]))
```

**Uso en Grafana**: 
- Tipo: Graph
- Legend: `p{{quantile_label}}`

---

### Latencia Mínima y Máxima

```promql
# Latencia mínima observada
min(http_request_duration_seconds_bucket{le="0.05"}) by (job)

# Latencia máxima observada
max(http_request_duration_seconds_bucket) by (job)

# Rango de latencia
max(http_request_duration_seconds_bucket) - min(http_request_duration_seconds_bucket)
```

---

### Promedio de Latencia

```promql
# Promedio simple
avg(rate(http_request_duration_seconds_sum[1m]) / rate(http_request_duration_seconds_count[1m]))

# Promedio ponderado por endpoint
avg by (method, path) (
  rate(http_request_duration_seconds_sum[1m]) / 
  rate(http_request_duration_seconds_count[1m])
)
```

---

### Degradación de Latencia Bajo Carga

```promql
# Diferencia entre latencia bajo carga vs. sin carga
(
  histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[1m])) 
  / 
  histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m:1m] offset 10m))
) * 100 - 100
```

**Interpretación**:
- 0%: Latencia igual
- >50%: Degradación significativa
- >200%: Degradación severa

---

## Tasa de Error y Confiabilidad

### Tasa de Error Global

```promql
# Errores 5xx
rate(http_requests_total{status=~"5.."}[1m]) / rate(http_requests_total[1m]) * 100

# Errores 4xx
rate(http_requests_total{status=~"4.."}[1m]) / rate(http_requests_total[1m]) * 100

# Tasa de éxito
rate(http_requests_total{status=~"2.."}[1m]) / rate(http_requests_total[1m]) * 100
```

---

### Errores por Código HTTP

```promql
# Desglose completo
rate(http_requests_total[1m]) by (status)

# Solo errores
rate(http_requests_total{status!~"2.."}[1m])

# Errores normalizados por tipo
rate(http_requests_total[1m]) by (status) / ignoring(status) group_left rate(http_requests_total[1m])
```

---

### Tasa de Errores de Conexión

```promql
# Conexiones rechazadas / timeouts
rate(http_requests_failed_total[1m])

# Errores por tipo (si está instrumentado)
rate(http_request_errors_total[1m]) by (error_type)
```

---

### Disponibilidad (Uptime)

```promql
# Uptime del servicio (%)
avg_over_time(up{job="app"}[1h]) * 100

# Downtime esperado basado en errores
100 - (
  rate(http_requests_total{status=~"2.."}[1m]) / 
  rate(http_requests_total[1m]) * 100
)
```

---

## Análisis por Endpoint

### Tráfico por Endpoint

```promql
# Requests por segundo por path
rate(http_requests_total[1m]) by (path)

# TOP 5 endpoints más usados
topk(5, rate(http_requests_total[1m]) by (path))

# Distribución de tráfico (%)
rate(http_requests_total[1m]) by (path) / ignoring(path) group_left sum(rate(http_requests_total[1m]))
```

---

### Latencia por Endpoint

```promql
# P95 latencia por path
histogram_quantile(0.95, 
  rate(http_request_duration_seconds_bucket[1m])
) by (path)

# TOP 5 endpoints más lentos
topk(5, 
  histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[1m])) by (path)
)

# Comparación: P95 vs Promedio por endpoint
(
  histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[1m])) 
  / 
  (rate(http_request_duration_seconds_sum[1m]) / rate(http_request_duration_seconds_count[1m]))
) by (path)
```

---

### Errores por Endpoint

```promql
# Tasa de error por endpoint
(
  rate(http_requests_total{status=~"5.."}[1m]) /
  rate(http_requests_total[1m])
) by (path) * 100

# Endpoints más problemáticos
topk(5, 
  (rate(http_requests_total{status=~"5.."}[1m]) / rate(http_requests_total[1m])) by (path)
)
```

---

### Requests por Método HTTP

```promql
# Distribución GET vs POST vs DELETE
rate(http_requests_total[1m]) by (method)

# Latencia promedio por método
avg(rate(http_request_duration_seconds_sum[1m]) / rate(http_request_duration_seconds_count[1m])) by (method)

# Tasa de error por método
(rate(http_requests_total{status=~"5.."}[1m]) / rate(http_requests_total[1m])) by (method) * 100
```

---

## Análisis de Recursos

### CPU y Memoria

```promql
# CPU en porcentaje
rate(container_cpu_user_seconds_total{name="posts_api"}[1m]) * 100

# Memoria en MB
container_memory_usage_bytes{name="posts_api"} / 1024 / 1024

# Ratio CPU/Requests (CPU eficiencia)
(rate(container_cpu_user_seconds_total[1m]) * 100) / rate(http_requests_total[1m])

# Ratio Memoria/Requests
container_memory_usage_bytes / rate(http_requests_total[1m]) / 1024
```

---

### Limits y Thresholds

```promql
# Uso de CPU vs. límite
(rate(container_cpu_user_seconds_total{name="posts_api"}[1m]) * 100) / 100

# Memoria vs. límite (si tienes límite establecido)
container_memory_usage_bytes{name="posts_api"} / 1073741824  # limite en bytes

# Alertar cuando esté cerca del límite (80%)
container_memory_usage_bytes{name="posts_api"} / 1073741824 > 0.8
```

---

### Node.js Específicos (si están instrumentados)

```promql
# Heap memory usage
nodejs_heap_size_used_bytes / 1024 / 1024

# Heap usage ratio
nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes

# Garbage collection frequency
rate(nodejs_gc_duration_seconds_count[1m])

# Event loop lag (latencia)
nodejs_eventloop_lag_seconds
```

---

## Análisis de Base de Datos

### Operaciones MongoDB

```promql
# Operaciones por segundo (todas)
rate(mongodb_opcounters_total[1m])

# Operaciones desglosadas
rate(mongodb_opcounters[1m]) by (type)

# Ratio escritura/lectura
rate(mongodb_opcounters{type="insert|update|delete"}[1m]) / 
rate(mongodb_opcounters{type="query|find"}[1m])
```

---

### Conexiones y Pool

```promql
# Conexiones activas
mongodb_connections_current

# Conexiones disponibles
mongodb_connections_available

# Ratio de utilización
(mongodb_connections_current / mongodb_connections_available) * 100

# Wait time en pool (ms)
mongodb_connection_pool_wait_time_sum / mongodb_connection_pool_wait_time_count
```

---

### Latencia de Consultas

```promql
# Tiempo promedio de query
mongodb_query_duration_sum / mongodb_query_duration_count

# Queries lentas (>100ms)
histogram_quantile(0.95, rate(mongodb_query_duration_bucket{le="0.1"}[1m]))
```

---

## Predicciones y Tendencias

### Líneas de Tendencia

```promql
# Predicción lineal de latencia (próximas 1 hora)
predict_linear(http_request_duration_seconds[1h], 3600)

# Predicción de tasa de crecimiento
rate(http_requests_total[1h])

# Extrapolación de requests/hora
rate(http_requests_total[5m]) * 3600
```

---

### Análisis de Cambios

```promql
# Cambio de latencia respecto a 10 minutos atrás
(
  http_request_duration_seconds 
  - 
  http_request_duration_seconds offset 10m
)

# % de cambio en tasa de errores
(
  (rate(http_requests_total{status=~"5.."}[1m]) / rate(http_requests_total[1m]))
  /
  (rate(http_requests_total{status=~"5.."}[1m] offset 10m) / rate(http_requests_total[1m] offset 10m))
) * 100 - 100
```

---

### Volatilidad y Varianza

```promql
# Desviación estándar de latencia
stddev_over_time(http_request_duration_seconds[5m])

# Coeficiente de variación (CV = desv / media)
(stddev_over_time(http_request_duration_seconds[5m]) / 
 avg_over_time(http_request_duration_seconds[5m])) * 100

# Estabilidad: varianza baja = mejor
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) - 
histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))
```

---

## Queries Útiles para Reportes

### Reporte de Sesión de Prueba Completa

```promql
# Resumen en 1 query
{
  "total_requests": increase(http_requests_total[1h]),
  "avg_latency_ms": avg(rate(http_request_duration_seconds_sum[1h]) / rate(http_request_duration_seconds_count[1h])) * 1000,
  "p95_latency_ms": histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[1h])) * 1000,
  "error_rate": (rate(http_requests_total{status=~"5.."}[1h]) / rate(http_requests_total[1h])) * 100,
  "avg_cpu": avg(rate(container_cpu_user_seconds_total[1h]) * 100),
  "peak_memory_mb": max(container_memory_usage_bytes[1h]) / 1024 / 1024,
  "uptime": avg_over_time(up[1h]) * 100
}
```

---

## Ejemplos de Paneles Avanzados

### Panel 1: Heatmap de Latencia

```promql
# Para heatmap, usa los buckets sin aggregation
rate(http_request_duration_seconds_bucket[5m])
```

**Configuración en Grafana**:
- Panel type: Heatmap
- Heatmap type: Time series
- Calcular sobre range

---

### Panel 2: Gráfico de Área Apilada (Requests por Estado)

```promql
rate(http_requests_total[1m]) by (status)
```

**Configuración**:
- Type: Area
- Stack: Series
- Legend: {{status}}

---

### Panel 3: Gauge de Salud del Sistema

```promql
# Verde: >95% uptime
# Amarillo: 90-95%
# Rojo: <90%

avg_over_time(up[1h]) * 100
```

**Thresholds**:
- 90 (Amarillo)
- 95 (Verde)

---

## Exportar Query como API Instant

En lugar de usar Grafana, puedes hacer queries directas a Prometheus:

```bash
# Query instant (valor actual)
curl 'http://localhost:9090/api/v1/query?query=rate(http_requests_total[1m])'

# Query rango (historico)
curl 'http://localhost:9090/api/v1/query_range?query=rate(http_requests_total[1m])&start=1677000000&end=1677086400&step=60'
```

---

## Tips y Tricks

### PromQL Útiles

1. **SumRate**: Suma todas las métricas normalizadas
   ```promql
   sum(rate(http_requests_total[1m]))
   ```

2. **By Clause**: Agrupa por etiqueta
   ```promql
   sum by (method) (rate(http_requests_total[1m]))
   ```

3. **Without Clause**: Suma excluyendo etiqueta
   ```promql
   sum without (instance) (http_requests_total)
   ```

4. **On Clause**: Join de dos métricas
   ```promql
   http_requests_total / on(job) group_left http_connections_total
   ```

5. **Offset**: Compara con periodo anterior
   ```promql
   http_requests_total - http_requests_total offset 1h
   ```

### Debug de Queries

- Abre http://localhost:9090
- Usa el tab "Graph" para ver resultados en tiempo real
- Experimenta con offset, range y step

