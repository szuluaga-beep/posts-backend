# Pruebas de Carga y Estrés con K6

Este proyecto incluye pruebas automatizadas de carga y estrés para validar el rendimiento del API.

## Archivos de Prueba

- **script.js** - Script principal (prueba de carga por defecto)
- **load-test.js** - Prueba de carga (Load Test)
- **stress-test.js** - Prueba de estrés (Stress Test)
- **spike-test.js** - Prueba de picos (Spike Test)
- **soak-test.js** - Prueba de resistencia (Soak Test)

## Tipos de Pruebas

### 1. **Prueba de Carga (Load Test)** - load-test.js
- **Objetivo**: Verificar el comportamiento del sistema bajo carga normal
- **Usuarios**: Ramp-up a 20 usuarios, mantener 30s, ramp-down
- **Duración**: ~2 minutos
- **Umbral de error**: < 10%
- **Latencia**: p(95) < 300ms

**Ejecutar:**
```bash
docker-compose run --rm k6 run /scripts/load-test.js
```

### 2. **Prueba de Estrés (Stress Test)** - stress-test.js
- **Objetivo**: Encontrar el límite de rendimiento del sistema
- **Usuarios**: Aumento progresivo hasta 100 usuarios
- **Duración**: ~3 minutos
- **Umbral de error**: < 20%
- **Latencia**: p(95) < 500ms

**Ejecutar:**
```bash
docker-compose run --rm k6 run /scripts/stress-test.js
```

### 3. **Prueba de Picos (Spike Test)** - spike-test.js
- **Objetivo**: Simular aumentos repentinos de tráfico
- **Usuarios**: Carga normal (10) → Pico (200) → Normal (10)
- **Duración**: ~50 segundos
- **Propósito**: Verifica la recuperación rápida del sistema

**Ejecutar:**
```bash
docker-compose run --rm k6 run /scripts/spike-test.js
```

### 4. **Prueba de Resistencia (Soak Test)** - soak-test.js
- **Objetivo**: Detectar fugas de memoria y degradación
- **Usuarios**: Carga sostenida de 15 usuarios durante 5 minutos
- **Duración**: ~7 minutos
- **Propósito**: Válida la estabilidad prolongada

**Ejecutar:**
```bash
docker-compose run --rm k6 run /scripts/soak-test.js
```

## Requisitos Previos

Asegúrate de que los servicios estén corriendo:

```bash
# Iniciar todos los servicios (sin k6)
docker-compose up -d

# Esperar a que el API esté listo
docker-compose logs -f app
```

## Ejecución de Pruebas

### Opción 1: Ejecutar pruebas individuales

```bash
# Prueba de carga
docker-compose run --rm k6 run /scripts/load-test.js

# Prueba de estrés
docker-compose run --rm k6 run /scripts/stress-test.js

# Prueba de picos
docker-compose run --rm k6 run /scripts/spike-test.js

# Prueba de resistencia
docker-compose run --rm k6 run /scripts/soak-test.js
```

### Opción 2: Ejecutar con resultados guardados

```bash
docker-compose run --rm k6 run /scripts/load-test.js \
  --out json=/results/load-test-$(date +%s).json \
  --summary-export=/results/load-test-summary.json
```

### Opción 3: Ejecutar con variables personalizadas

```bash
# Cambiar número de usuarios virtuales
docker-compose run --rm -e K6_VUS=50 k6 run /scripts/stress-test.js

# Cambiar duración
docker-compose run --rm -e K6_DURATION=60s k6 run /scripts/load-test.js
```

## Interpretar Resultados

K6 genera reportes con las siguientes métricas:

- **http_req_duration**: Tiempo de respuesta HTTP
  - p(95): 95% de las respuestas están bajo este tiempo
  - p(99): 99% de las respuestas están bajo este tiempo

- **http_req_failed**: Tasa de solicitudes fallidas
  - rate: Porcentaje de fallos

- **http_reqs**: Total de solicitudes realizadas

- **iterations**: Número de iteraciones completadas

### Ejemplo de output:

```
✓ status is 200
✓ response time < 300ms

running (2m31s), 00/20 VUs, 240 complete and 0 interrupted iterations
...
http_req_duration................: avg=125ms    min=80ms     med=110ms    max=450ms     p(95)=280ms   p(99)=410ms
http_reqs.........................: 3240 15.1/s
iteration_duration................: avg=2.15s    min=2.05s    med=2.12s    max=2.8s
iterations........................: 3240 15.1/s
```

## Monitoreo en Tiempo Real

Mientras ejecutas las pruebas, puedes monitorear en Grafana:

1. Abre http://localhost:3001
2. Usa las credenciales: admin/admin
3. Visualiza las métricas del API en los dashboards

## Solución de Problemas

### El API no responde durante las pruebas

- Verifica logs: `docker-compose logs app`
- Aumenta los recursos de Docker
- Reduce el número de VUs

### Conexión rechazada a http://app:3000

- Verifica que los contenedores estén corriendo: `docker-compose ps`
- El nombre del servicio en docker-compose es `app`

### No se guardan los resultados

- Crea la carpeta: `mkdir -p k6-results`
- Verifica permisos: `chmod 777 k6-results`

## Parámetros Avanzados

### Ejecutar con k6 Cloud

```bash
docker-compose run --rm k6 run /scripts/load-test.js \
  --out cloud \
  -p project-id=YOUR_PROJECT_ID
```

### Ejecutar múltiples casos de prueba

```bash
# Crear un script wrapper
#!/bin/bash
echo "=== Prueba de Carga ==="
docker-compose run --rm k6 run /scripts/load-test.js

echo "=== Prueba de Estrés ==="
docker-compose run --rm k6 run /scripts/stress-test.js

echo "=== Prueba de Picos ==="
docker-compose run --rm k6 run /scripts/spike-test.js
```

## Referencias

- [K6 Documentation](https://k6.io/docs/)
- [K6 API Reference](https://k6.io/docs/javascript-api)
- [Best Practices for Load Testing](https://k6.io/docs/testing-guides/load-testing)
