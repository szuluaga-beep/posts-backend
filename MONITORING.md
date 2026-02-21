# Posts Backend - Monitoring Setup

Este proyecto ahora incluye configuración completa de **Prometheus** y **Grafana** para monitorizar la aplicación Express + TypeScript en local.

## 📊 Componentes de Monitorización

El stack de monitorización incluye:

- **Prometheus** (9090): Sistema de métricas y base de datos TSDB
- **Grafana** (3001): Visualización de métricas y dashboards
- **Alertmanager** (9093): Gestión y enrutamiento de alertas
- **Node Exporter** (9100): Métricas del sistema operativo
- **MongoDB**: Base de datos de la aplicación
- **Posts API** (3000): Aplicación con métricas integradas

## 🚀 Inicio Rápido

### 1. Instalar dependencias
```bash
npm install
```

### 2. Iniciar los servicios con Docker Compose
```bash
docker-compose up -d
```

Esto levantará todos los servicios:
- API en `http://localhost:3000`
- MongoDB en `http://localhost:27017`
- Prometheus en `http://localhost:9090`
- Grafana en `http://localhost:3001`
- Alertmanager en `http://localhost:9093`
- Node Exporter en `http://localhost:9100`

### 3. Acceder a Grafana
1. Abre `http://localhost:3001` en tu navegador
2. Login: `admin` / `admin`
3. Añade Prometheus como datasource (será agregado automáticamente)
4. Explora los dashboards

## 📈 Endpoints del Monitoreo

| Endpoint | Puerto | Descripción |
|----------|--------|-------------|
| `/health` | 3000 | Health check de la aplicación |
| `/metrics` | 3000 | Métricas en formato Prometheus |
| Prometheus UI | 9090 | Query builder para PromQL |
| Grafana | 3001 | Dashboards y visualización |
| Alertmanager | 9093 | Gestión de alertas |

## 📊 Métricas Disponibles

### Métricas de la Aplicación
- `http_requests_total`: Total de requests HTTP
- `http_request_errors_total`: Total de errores HTTP
- `http_request_duration_seconds`: Duración de requests (Histogram)
- `app_memory_usage_bytes`: Uso de memoria
- `app_cpu_usage_percent`: Uso de CPU
- `app_active_connections`: Conexiones activas

### Métricas de Base de Datos
- `database_query_duration_seconds`: Duración de queries a MongoDB
- `mongoose_connection_status`: Estado de conexión (1=conectado, 0=desconectado)

### Métricas del Sistema
Del Node Exporter:
- `node_cpu_seconds_total`
- `node_memory_MemTotal_bytes`
- `node_memory_MemAvailable_bytes`
- `node_filesystem_avail_bytes`

## 🔥 Simular Carga

Para probar el sistema con carga simulada:

### En PowerShell (Windows):
```powershell
# Generar 100 requests continuos
for ($i = 1; $i -le 100; $i++) {
    Invoke-WebRequest -Uri "http://localhost:3000/api/posts" -Method GET
    Start-Sleep -Milliseconds 100
}
```

### En Bash (Linux/Mac):
```bash
# Generar requests continuos
while true; do
    curl http://localhost:3000/api/posts
    sleep 0.1
done
```

## ⚠️ Alertas Configuradas

El sistema viene con alertas preconfiguradas:

- **HighErrorRate**: Tasa de error > 0 en 5 minutos
- **HighRequestLatency**: P95 latencia > 1 seg
- **CriticalHighLatency**: P99 latencia > 2 seg
- **HighMemoryUsage**: Memoria de app > 0.5 GB
- **HighCPUUsage**: CPU > 80%
- **ServiceDown**: Servicio no responde
- **HighDiskUsage**: Disco < 15% disponible
- **HighMemoryUsageSystem**: Memoria del sistema > 90%

## 📝 Archivos de Configuración

- `prometheus.yml`: Configuración de Prometheus y endpoints a scrapear
- `alert_rules.yml`: Reglas de alertas en PromQL
- `alertmanager.yml`: Configuración de enrutamiento de alertas
- `grafana-datasources.yml`: Configuración de datasources
- `grafana-dashboards.yml`: Configuración de dashboards

## 🔧 Desarrollo Local

Para desarrollo sin Docker:

```bash
# Terminal 1: Ejecutar la aplicación
npm run dev

# Terminal 2: Ejecutar Prometheus (requiere instalación local)
prometheus --config.file=prometheus.yml
```

## 🛑 Detener los servicios

```bash
# Detener todos los contenedores
docker-compose down

# Detener eliminando volúmenes (limpia datos)
docker-compose down -v
```

## 📚 Recursos Útiles

- [Prometheus Documentation](https://prometheus.io/docs/)
- [PromQL Query Language](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Grafana Dashboard Guide](https://grafana.com/docs/grafana/latest/dashboards/)
- [Node.js Prometheus Exporter](https://github.com/siimon/prom-client)
- [Alerting Best Practices](https://prometheus.io/docs/practices/alerting/)

## 📋 Próximos Pasos

1. **Crear Dashboards Personalizados** en Grafana
2. **Configurar Notificaciones** en Alertmanager (Slack, Email, etc.)
3. **Optimizar Alertas** según tus umbrales específicos
4. **Implementar Trazabilidad** (OpenTelemetry) para debugging distribuido

## ❓ Troubleshooting

### Prometheus no ve las métricas
- Verifica que la app esté corriendo: `curl http://localhost:3000/health`
- Revisa `http://localhost:9090/targets` en Prometheus UI

### Grafana no conecta con Prometheus
- Verifica que Prometheus esté corriendo: `curl http://localhost:9090/-/healthy`
- En Grafana, edita el datasource y prueba la conexión

### Contenedores no inician
```bash
# Ver logs
docker-compose logs -f

# Reconstruir imágenes
docker-compose down
docker-compose up --build
```
