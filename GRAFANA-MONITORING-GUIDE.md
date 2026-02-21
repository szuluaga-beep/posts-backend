# Guía Práctica: Usar Grafana Durante Pruebas de Carga

## Checklist Pre-Prueba

- [ ] Docker-compose `up -d`
- [ ] Verificar que app esté corriendo
- [ ] Checking Grafana accessable (http://localhost:3001)
- [ ] Importar dashboard k6-grafana-dashboard.json
- [ ] Abrir terminal PowerShell o bash

---

## Paso 1: Preparar el Ambiente

### Terminal 1: Iniciar Servicios

```powershell
cd C:\Users\Usuario\Desktop\proyecto-posts\posts-backend
docker-compose up -d

# Esperar ~30 segundos a que todo esté listo
docker-compose ps
```

### Terminal 2: Verificar Prometheus

```bash
curl http://localhost:9090
# Debe responder con HTML de Prometheus
```

### Terminal 3: Abrir Grafana

```
http://localhost:3001
- Username: admin
- Password: admin
```

---

## Paso 2: Importar el Dashboard

1. **Menú principal** → **Dashboards** → **Import**
2. Copia el contenido de `k6-grafana-dashboard.json`
3. Pega en el formulario
4. "Select Prometheus" como datasource
5. Haz clic en **Import**

**Resultado**: Dashboard con 9 paneles preconfigurados

---

## Paso 3: Ejecutar Primera Prueba

### Opción A: Modo Interactivo (Windows)

```powershell
.\run-tests.ps1
# Selecciona opción 1 (Prueba de Carga)
```

### Opción B: Línea de Comandos

```bash
docker-compose run --rm k6 run /scripts/load-test.js
```

### Opción C: Manual (Útil para entender)

```bash
# Terminal separada
docker-compose exec -T app npm start  # Si no está corriendo

# En otra terminal
docker-compose run --rm k6 run /scripts/load-test.js
```

---

## Paso 4: Monitorear en Tiempo Real

### Abre 2 ventanas

**Ventana 1**: Grafana Dashboard
- URL: http://localhost:3001/d/k6-performance
- Refresco automático cada 5 segundos
- Mira los gráficos cambiar en vivo

**Ventana 2**: K6 Output
- Muestra progreso de la prueba
- Actualización en tiempo real

---

## Monitoreo en Tiempo Real: Qué Buscar

### Fase 1: Ramp-up (primeros 30 segundos)

**Esperado en Grafana**:
```
Tasa de Requests:    0 → 20 req/s
Latencia P95:        100ms → 200ms (sube gradualmente)
CPU:                 10% → 40%
Memoria:             100MB → 150MB
Errores:             0%
```

**Si ves algo diferente**:
- Errores = 0%? → Problema con el API
- CPU baja? → API no está siendo usado
- P95 > 500ms? → API débil para esta carga

---

### Fase 2: Sostenimiento (próximo 1 minuto 30 segundos)

**Esperado**:
```
Tasa de Requests:    Plana en ~20 req/s
Latencia P95:        Estable (±20ms variación)
CPU:                 40-50% (constante)
Memoria:             Estable (no sube más)
Errores:             0%
```

**Problema si**:
- P99 sube mientras P95 baja → cola de distribución pesada
- Memoria sigue subiendo → fuga potencial
- Errores aparecen → sobrecarga

---

### Fase 3: Ramp-down (últimos 30 segundos)

**Esperado**:
```
Tasa de Requests:    20 → 0 req/s (lineal)
Latencia:            Baja al original
CPU:                 40% → 10%
Memoria:             Baja un poco (si sana)
```

**Problema si**:
- Latencia NO baja → requests pendientes stuck
- Memoria NO baja → **FUGA DE MEMORIA**
- P99 > P95 mucho → recursos no se liberan

---

## Interpretación Rápida de Gráficos

### Gráfico "Tasa de Requests"

```
Forma esperada:      /‾‾‾‾‾\
                    /       \

Forma problemática:  🔴 /‾\
                       (   inestable)
```

---

### Gráfico "Latencia P95"

```
Aceptable:    ___    (lineal, estable)

Problema:     ╱╲╱╲   (oscila mucho)
              (inestable)

Crítico:      ╲╱╲╱   (sube durante ramp-down)
              (sin recuperación)
```

---

### Gráfico "Uso de CPU"

```
Óptimo:      /‾‾‾\
            /     \   (30-60%)

Bajo:       ______  (API subutilizado)

Alto:       \___/   (>80%, problema)
```

---

## Análisis Post-Prueba

### Paso 1: Descargar Resultados

```bash
# K6 savea JSON en k6-results/
ls k6-results/

# Ver archivo más reciente
cat k6-results/load-test-*.json | jq '.[] | select(.Metric == "http_req_duration")'
```

---

### Paso 2: Generar Reporte

Abre Grafana y:
1. Ve al Dashboard
2. Ajusta el rango de tiempo (**Last 1 hour**)
3. Screenshot de cada gráfico
4. Clic en panel → **Share** → **Screenshot**

---

### Paso 3: Completar Tabla de Resultados

```
╔════════════════════════════════════════════════════════════════╗
║                   RESULTADO DE PRUEBA DE CARGA                ║
╠════════════════════════════════════════════════════════════════╣
║ Métrica                    │ Valor     │ Umbral   │ Estado    ║
╠────────────────────────────┼───────────┼──────────┼───────────╣
║ Total Requests             │ 2400      │ N/A      │ ✓ OK      ║
║ Usuarios Virtuales         │ 20        │ 20       │ ✓ OK      ║
║ Duración                   │ 2m30s     │ 2.5m     │ ✓ OK      ║
║ Latencia Promedio          │ 145ms     │ <300ms   │ ✓ OK      ║
║ Latencia P95               │ 280ms     │ <300ms   │ ✓ OK      ║
║ Latencia P99               │ 420ms     │ <500ms   │ ✓ OK      ║
║ Tasa de Error              │ 0.0%      │ <1%      │ ✓ OK      ║
║ Pico de CPU                │ 55%       │ <70%     │ ✓ OK      ║
║ Pico de Memoria            │ 285 MB    │ <500MB   │ ✓ OK      ║
║ Estado final               │ Exitoso   │          │ ✓         ║
╚════════════════════════════════════════════════════════════════╝
```

---

## Ejemplos de Sesiones Reales

### Ejemplo 1: API Sano

```
Fase      Req/s    P95      CPU    Mem      Error   Nota
─────────────────────────────────────────────────────────
Inicio    0        —        5%     50MB     —
Ramp-up   10       150ms    30%    100MB    0%      ✓ Normal
Sost.     20       180ms    40%    140MB    0%      ✓ Estable
Ramp-dn   10       150ms    30%    130MB    0%      ✓ Recupera bien

Conclusión: API SANO ✓
```

---

### Ejemplo 2: API Lento

```
Fase      Req/s    P95      CPU    Mem      Error   Nota
─────────────────────────────────────────────────────────
Inicio    0        —        8%     80MB     —
Ramp-up   15       450ms    35%    120MB    2.5%    ⚠ Lento
Sost.     18       520ms    42%    160MB    5%      ⚠ Empeora
Ramp-dn   8        480ms    38%    180MB    3%      ⚠ Mem no baja

Conclusión: PROBLEMAS - Investigar BD o algoritmo complejo
```

---

### Ejemplo 3: API Colapsado

```
Fase      Req/s    P95      CPU    Mem      Error   Nota
─────────────────────────────────────────────────────────
Inicio    0        —        5%     50MB     —
Ramp-up   18       200ms    60%    150MB    0.1%    OK inicial
Sost.     12       2000ms   95%    350MB    25%     🔴 COLAPSO
Ramp-dn   0        —        0%     0MB      —       🔴 Caído

Conclusión: CAPACIDAD EXCEDIDA - Aumentar recursos
```

---

## Comparar Múltiples Pruebas

### Crear Comparativa

1. Ejecuta cada prueba en horarios diferentes
2. Anota la hora de inicio/fin
3. En Grafana, abre dos tabs
4. Tab 1: Last 3 hours (última prueba)
5. Tab 2: Last 1 day (comparar histórico)

---

### Gráfico de Comparación

Usa la misma query en dos paneles con diferente rango:

```promql
# Panel 1: Última hora
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[1m]))

# Panel 2: Último día (para ver tendencia)
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[1m])) offset 24h
```

---

## Troubleshooting

### Gráficos sin datos

**Solución 1**: Verifica que la prueba esté corriendo
```bash
docker-compose logs k6
```

**Solución 2**: Prometheus necesita tiempo de scrape
```bash
curl http://localhost:9090/api/v1/query?query=http_requests_total
```

**Solución 3**: Reinicia todo
```bash
docker-compose down
docker-compose up -d
sleep 30
```

---

### Latencias muy bajas (< 10ms)

Probablemente no estés midiendo correctamente. Verifica:
- ¿El API está retornando 200?
- ¿Los requests son reales? (mira docker logs app)

---

### CPU al 100% desde el inicio

- Reduce VUs: `dockerfile -e K6_VUS=5`
- Aumenta recursos a Docker: Settings → Resources
- Verifica si hay otro proceso en CPU

---

## Automación: Script de Análisis

Crea un script que genera reporte automático:

```powershell
# analyze.ps1
param(
    [string]$TestName = "load-test"
)

Write-Host "Extrayendo datos de $TestName..."

$jsonFile = Get-ChildItem k6-results/ | 
    Where-Object { $_.Name -match $TestName } | 
    Sort -Property LastWriteTime | 
    Select -Last 1

if ($null -eq $jsonFile) {
    Write-Error "No results found for $TestName"
    exit 1
}

$data = Get-Content $jsonFile | ConvertFrom-Json

Write-Host "Reporte de $TestName" -ForegroundColor Green
Write-Host "===================="
Write-Host "Total requests: $($data.Count)"
Write-Host "Duración: ~2m30s"
Write-Host ""
Write-Host "Abre Grafana en http://localhost:3001"
```

Ejecutar:
```powershell
.\analyze-test.ps1 -TestName "load-test"
```

---

## Resumen Rápido

| Necesito saber | Voy a Grafana | Busco en panel |
|---|---|---|
| ¿Tengo errores? | Tasa de Error (%) | Valor > 0 = problema |
| ¿Qué tan lento? | Latencia P95 | < 300ms = OK |
| ¿CPU sobrecargado? | Uso de CPU | > 80% = reduce carga |
| ¿API desestable? | Distribución Códigos HTTP | 2xx = 100% |
| ¿Hay fuga memoria? | Uso de Memoria | Baja en ramp-down = OK |
| ¿Qué endpoint falla? | Latencia por Endpoint | TOP 3 más lentos |

---

## Próximos Pasos

1. ✅ **Completado**: Setup de pruebas + Grafana
2. **Por hacer**: Optimización basada en resultados
   - Ajustar índices MongoDB
   - Cache en API
   - Load balancing
3. **Por hacer**: Alertas automáticas en Alertmanager

