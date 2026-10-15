# RFC-31: Contrato Estandarizado de Telemetría y Observabilidad de Salud (`/health`)

- **RFC Number:** RFC-31
- **Título:** Contrato Estandarizado de Salud, Disponibilidad de Infraestructura y Observabilidad en Tiempo Real
- **Fecha:** 2026-10-14
- **Autor:** Equipo Frontend Portal (Portal Web & Clean Architecture)
- **Destinatarios:** Equipo Backend (`apps/chatbot/service/api`), Operaciones y DevOps
- **Estado:** PROPUESTO (En proceso de adopción)
- **Caso de Uso Vinculado:** CU-01: Monitor de Salud, Disponibilidad de Infraestructura y Observabilidad

---

## 1. Resumen Ejecutivo

Este documento formaliza y propone el contrato de respuesta para el endpoint `/health` del motor conversacional (`FastAPI / Uvicorn`). 

Actualmente, el backend expone un endpoint de verificación básica que retorna:
```json
{
  "status": "ok"
}
```
O de forma enriquecida en versiones preliminares:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "checks": {
    "database": { "status": "healthy", "latency_ms": 26.51, "engine": "mssql" },
    "broker": { "status": "healthy", "latency_ms": 0.1, "engine": "rabbitmq" },
    "ai_engine": { "status": "healthy", "latency_ms": 0.1 }
  }
}
```

Para asegurar una observabilidad enterprise de alta fidelidad desde el portal frontend, consolas de monitoreo (Datadog, Prometheus) y balanceadores de carga (Kubernetes, AWS ALB), esta RFC define:
1. La estructura JSON formal y tipada para la respuesta `/health`.
2. Las convenciones de códigos de estado HTTP (200 vs 503).
3. El patrón *Tolerant Reader* adoptado en el frontend para soportar transiciones sin downtime.

---

## 2. Motivación y Beneficios

1. **Diagnóstico Preciso de Fallas:** Permite a soporte y a los ingenieros identificar inmediatamente si un problema en el sistema se debe a la base de datos relacional (MSSQL), al broker de mensajería asíncrono (RabbitMQ), o al motor de inferencia de IA.
2. **Medición de Latencia por Microservicio:** Facilita la detección temprana de cuellos de botella en la red o degradación de pools de conexión.
3. **Desacoplamiento Resiliente:** El frontend puede operar en modo degradado o alertar selectivamente según el componente afectado.

---

## 3. Especificación Técnica del Contrato

### 3.1 Endpoint
- **Ruta:** `GET /health`
- **Cabeceras Aceptadas:** `Accept: application/json`
- **Timeout Máximo Garantizado por el Backend:** `2000ms` (las verificaciones internas deben correr en paralelo con `asyncio.gather` y timeouts per-probe).

### 3.2 Esquema JSON Recomendado

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime_seconds": 14238.45,
  "timestamp": "2026-10-14T21:10:00Z",
  "checks": {
    "database": {
      "status": "healthy",
      "latency_ms": 14.2,
      "engine": "mssql",
      "database": "chatbot_dev",
      "message": "Pool de conexiones activo y respondiendo"
    },
    "broker": {
      "status": "healthy",
      "latency_ms": 1.8,
      "engine": "rabbitmq",
      "host": "chatbot_broker:5672",
      "message": "Canales AMQP operacionales"
    },
    "ai_engine": {
      "status": "healthy",
      "latency_ms": 42.1,
      "provider": "openai/langchain",
      "message": "Modelos y embeddings alcanzables"
    }
  }
}
```

### 3.3 Definición de Campos y Niveles

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `status` | `string` | Sí | `"healthy"`, `"degraded"`, `"unhealthy"` |
| `version` | `string` | Opcional | Versión semántica del motor API (`x.y.z`) |
| `uptime_seconds` | `number` | Opcional | Tiempo de actividad del proceso Uvicorn |
| `timestamp` | `string (ISO 8601)` | Opcional | Marca de tiempo UTC de la ejecución del chequeo |
| `checks` | `Record<string, CheckObject>` | Recomendado | Diccionario de subsistemas evaluados |

#### Estructura de `CheckObject`
| Subcampo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `status` | `string` | Sí | `"healthy"`, `"degraded"`, `"unhealthy"` |
| `latency_ms` | `number` | Recomendado | Tiempo de ida y vuelta de la prueba interna |
| `engine` / `database` | `string` | Opcional | Identificador tecnológico (`mssql`, `rabbitmq`, etc.) |
| `message` | `string` | Opcional | Detalle explicativo de la prueba o motivo del error |

---

## 4. Códigos de Estado HTTP

- **HTTP 200 OK:**
  - El sistema está completamente operacional (`status: "healthy"`).
  - El sistema está operando en modo degradado pero capaz de responder peticiones (`status: "degraded"`).
- **HTTP 503 Service Unavailable:**
  - Un componente crítico (p.ej. base de datos primaria inaccesible o fallo general) impide el procesamiento de conversaciones (`status: "unhealthy"`).

---

## 5. Implementación en el Frontend Portal (Tolerant Reader)

Para garantizar compatibilidad total con cualquier entorno:
1. **Fallback Automático:** Si el backend solo responde `{"status": "ok"}`, el adaptador `HttpHealthAdapter` del portal infiere el estado del API y muestra los componentes principales del stack Docker (`chatbot_db`, `chatbot_broker`) con telemetría estimada calculada sobre el RTT HTTP.
2. **Adaptación a RFC-31:** En cuanto el backend envía el objeto `checks`, el frontend conmuta automáticamente a renderizar la telemetría granular real de cada microservicio.
3. **Inspector de JSON en Vivo:** El modal de diagnóstico provee una consola con resaltado de sintaxis donde los desarrolladores y operadores pueden inspeccionar el payload crudo en cualquier momento.

---

## 6. Recomendaciones de Implementación para el Backend (`FastAPI`)

1. Usar chequeos concurrentes no bloqueantes:
   ```python
   # apps/chatbot/service/api/health.py
   async def check_all_components():
       db_task = asyncio.create_task(ping_database())
       broker_task = asyncio.create_task(ping_broker())
       
       results = await asyncio.gather(db_task, broker_task, return_exceptions=True)
       # Formatear y retornar objeto compatible RFC-31
   ```
2. Asegurar que las excepciones individuales no detengan la evaluación de los demás microservicios (`return_exceptions=True`).
3. Limitar cada sub-chequeo a un timeout estricto (e.g. `asyncio.wait_for(task, timeout=1.5)`).

---

## 7. Aprobaciones y Seguimiento

- [x] Especificación técnica redactada y validada en Frontend Portal.
- [x] Adaptador `HttpHealthAdapter` compatible y probado al 100% con pruebas unitarias.
- [ ] Revisión y adopción por parte del equipo Backend API.
