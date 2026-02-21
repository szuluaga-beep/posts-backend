# Gráficos para Grafana - Análisis de Pruebas de Carga K6

## Tabla de Contenidos
1. [Gráficos Principales](#gráficos-principales)
2. [Cómo Interpretar los Datos](#cómo-interpretar-los-datos)
3. [Importar el Dashboard](#importar-el-dashboard)
4. [Crear Gráficos Personalizados](#crear-gráficos-personalizados)

---

## Gráficos Principales

### 1. **Tasa de Requests por Segundo**
**Ubicación**: Superior izquierda
**Métrica**: `rate(http_requests_total[1m])`
**Descripción**: Muestra cuántas solicitudes HTTP está procesando el API por segundo en tiempo real
**Qué buscar**:
- Debe seguir el patrón de rampa definido (0 → 20 → 0 usuarios)
- Picos consistentes indican carga equilibrada
- Caídas abruptas pueden indicar errores o timeouts

**Ejemplo**:
- Prueba de carga: ~20 req/s (sostenido)
- Prueba de estrés: ~30-50 req/s (al alcanzar 100 VUs)
- Prueba de picos: Salto de 5 a 100 req/s instantáneamente

---

### 2. **Latencia - P95, P99 y Promedio**
**Ubicación**: Superior derecha
**Métricas**: 
- `histogram_quantile(0.95, ...)`  → P95 (95% de requests bajo este tiempo)
- `histogram_quantile(0.99, ...)`  → P99 (99% de requests bajo este tiempo)
- `avg(...)`                        → Promedio

**Descripción**: Percentiles de tiempo de respuesta. Indica experiencia del usuario
**Interpretación**:
- **P95 < 300ms**: Bueno (95% de usuarios tiene excelente experiencia)
- **P95 < 500ms**: Aceptable (la mayoría está contento)
- **P95 > 1000ms**: Problema (muchos usuarios notan lentitud)
- **P99 >> P95**: La cola de distribución es pesada (algunos usuarios muy afectados)

**Patrones normales**:
```
Prueba de Carga:
- Ramp-up: Baja latencia (100-150ms)
- Sostenida: Lineal (150-250ms)
- Ramp-down: Baja de nuevo

Prueba de Estrés:
- Aumenta progresivamente (150ms → 800ms)
- Punto de quiebre: P99 sube > 2000ms
```

---

### 3. **Tasa de Error (%)**
**Ubicación**: Medio izquierda
**Métrica**: `(requests 5xx / total requests) * 100`
**Descripción**: Porcentaje de solicitudes que fallan
**Umbrales**:
- **0-1%**: Excelente
- **1-5%**: Aceptable
- **5-10%**: Investigar
- **>10%**: Problema crítico

**Causas comunes de error**:
- API sobrecargado
- Base de datos sin conexión
- Falta de memoria
- Configuración incorrecta

---

### 4. **Estado del API**
**Ubicación**: Medio derecha
**Métrica**: `up{job="app"}`
**Descripción**: Disponibilidad del servicio (1=Up, 0=Down)
**Ideal**: Línea recta en 1 durante toda la prueba
**Problema**: Si cae a 0, el servicio colapsó

---

### 5. **Total Requests (último minuto)**
**Ubicación**: Esquina derecha, medio
**Métrica**: `increase(http_requests_total[1m])`
**Descripción**: Número absoluto de requests en el último minuto
**Uso**: Validar volumen de carga
**Ejemplo**:
- Prueba de carga (20 VUs): ~1200 requests/min
- Prueba de estrés (100 VUs): ~3000 requests/min

---

### 6. **Uso de CPU del API**
**Ubicación**: Inferior izquierda
**Métrica**: `rate(container_cpu_user_seconds_total[1m]) * 100`
**Descripción**: Porcentaje de CPU que consume el contenedor
**Interpretación**:
- **0-30%**: Subutilizado
- **30-70%**: Óptimo
- **70-90%**: Preocupante
- **>90%**: Crítico (probablemente throttling)

**Análisis**:
- Debe crecer con la rampa de usuarios
- Máximo esperado en pico de carga
- Debe bajar al ramp-down

---

### 7. **Uso de Memoria del API**
**Ubicación**: Inferior derecha
**Métrica**: `container_memory_usage_bytes{name="posts_api"}`
**Descripción**: Memoria RAM consumida por el proceso Node.js
**Interpretación**:
- Debe crecer lentamente durante carga
- **Fuga de memoria**: Sigue subiendo sin bajar en ramp-down
- **Normal**: Estable o leve aumento, baja en ramp-down

**Límites típicos**:
- Node.js inicial: ~50-100 MB
- Con carga: 200-500 MB
- Alerta: >1 GB

---

### 8. **Distribución de Códigos de Estado HTTP**
**Ubicación**: Inferior central
**Métricas**: 
- `2xx`: Sucessos
- `4xx`: Errores del cliente
- `5xx`: Errores del servidor

**Descripción**: Proporción de respuestas por tipo
**Ideal**: 100% en 2xx (verdes)
**Problema**:
- Aumento de 5xx durante carga → Servidor sobrecargado
- Picos de 4xx → Validación fallida o requests malformadas

---

### 9. **Latencia Promedio por Endpoint**
**Ubicación**: Esquina inferior derecha
**Métrica**: `avg by (method, path) (...)`
**Descripción**: Compara latencia entre endpoints
**Uso**: Identifica bottlenecks
**Ejemplo de output**:
```
GET /posts         → 120ms
POST /posts        → 250ms (más lento: escribe en BD)
DELETE /posts/:id  → 200ms
```

---

## Cómo Interpretar los Datos

### Análisis de Prueba de Carga Exitosa

```
Gráfico          Valor Esperado              Interpretación
─────────────────────────────────────────────────────────────
Req/s            Rampa 0→20→0                ✓ Carga bien distribuida
P95 Latencia     < 300ms                     ✓ Excelente experiencia
Error Rate       0-1%                        ✓ Confiabilidad alta
Estado API       Línea en 1                  ✓ Sin caídas
CPU              40-60%                      ✓ Buena utilización
Memoria          200-300 MB                  ✓ Sin fugas
2xx Success      >99%                        ✓ Casi todo exitoso
```

### Análisis de Prueba de Estrés (Encontrando Límites)

```
Fase          Síntoma              Diagnóstico
──────────────────────────────────────────────────
Ramp-up       Latencia sube rápido → API tiene poca capacidad
              CPU >90%             → CPU está al límite
              
Pico          Errores 5xx suben    → Desbordamiento
              Timeouts frecuentes  → Procesamiento lento
              
Límite        Latencia P99 >>1000ms → Punto de quiebre encontrado
              Errores >20%         → Sistema rechaza requests
              
Recovery      Lenta recuperación   → Fugas de recursos
              No vuelve a bajar    → Deadlock o sesiones stuck
```

---

## Importar el Dashboard

### Método 1: Via JSON (Recomendado)

1. Abre **Grafana** en http://localhost:3001
2. Ve a **Dashboards** → **Import**
3. Pega el contenido de `k6-grafana-dashboard.json`
4. Selecciona datasource **Prometheus**
5. Haz clic en **Import**

### Método 2: Via Archivo

```bash
# Copia el archivo al volumen de Grafana
docker cp k6-grafana-dashboard.json posts_grafana:/etc/grafana/provisioning/dashboards/

# Reinicia Grafana
docker-compose restart grafana
```

---

## Crear Gráficos Personalizados

### Ejemplo 1: Requests por Método HTTP

**Paso 1**: Nuevo panel
**Paso 2**: Data Source = Prometheus
**Paso 3**: Query
```
rate(http_requests_total[1m]) by (method)
```
**Paso 4**: Legend = `{{method}}`

---

### Ejemplo 2: Conexiones Activas a MongoDB

**Query**:
```
mongodb_connections_active{instance="mongodb:27017"}
```

---

### Ejemplo 3: Tiempo Total de Iteración K6

Si exportas resultados a Prometheus desde K6:
```
k6_iteration_duration_seconds
```

---

### Ejemplo 4: Gráfico Heatmap de Latencias

Útil para ver distribución completa:
```
rate(http_request_duration_seconds_bucket[1m])
```
- Tipo: Heatmap
- Muestra cómo evolucionan todas las latencias

---

### Ejemplo 5: Alertas Automáticas

Basadas en los gráficos:

**Alerta 1**: P95 Latencia > 500ms
```
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[1m])) > 0.5
```

**Alerta 2**: Tasa de error > 5%
```
(rate(http_requests_total{status=~"5.."}[1m]) / rate(http_requests_total[1m])) > 0.05
```

**Alerta 3**: CPU > 85%
```
rate(container_cpu_user_seconds_total{name="posts_api"}[1m]) * 100 > 85
```

---

## Métricas Adicionales que Podrías Agregar

### Node.js específicos
```promql
# Memoria heap
nodejs_heap_size_used_bytes
nodejs_heap_size_total_bytes

# Event loop lag
nodejs_eventloop_lag_seconds

# Handles/Requests activos
nodejs_active_handles
nodejs_active_requests
```

### MongoDB
```promql
# Operaciones
mongodb_opcounters_insert_total
mongodb_opcounters_query_total
mongodb_opcounters_update_total
mongodb_opcounters_delete_total

# Conexiones
mongodb_connections_current
mongodb_connections_available
```

### Network (Node Exporter)
```promql
# Bytes enviados/recibidos por interfaz
rate(node_network_transmit_bytes_total[1m])
rate(node_network_receive_bytes_total[1m])

# Paquetes perdidos
rate(node_network_transmit_drop_total[1m])
rate(node_network_receive_drop_total[1m])
```

---

## Troubleshooting: Gráficos Vacíos

### Problema: "No data"

1. ¿Está corriendo Prometheus?
   ```bash
   docker-compose ps | grep prometheus
   ```

2. ¿Está el API exportando métricas?
   ```bash
   curl http://localhost:3000/metrics
   ```

3. ¿Está correcta la query?
   - Ve a **Prometheus** http://localhost:9090
   - Prueba la query manualmente

### Problema: Métrica no existe

La métrica necesita ser instrumentada en el código. Verifica [aquí](../src/metrics/prometheus.ts).

---

## Resumen Rápido

| Tipo de Prueba | Qué Buscar | Métrica Clave |
|---|---|---|
| **Load** | Latencia consistente | P95 < 300ms |
| **Stress** | Punto de quiebre | Dónde sube P99 exponencialmente |
| **Spike** | Recuperación rápida | Tiempo hasta volver a latencia normal |
| **Soak** | Fugas de recursos | Memoria debe bajar en ramp-down |

