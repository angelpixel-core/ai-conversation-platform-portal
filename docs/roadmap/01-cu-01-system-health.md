# 📐 CU-01: Monitor de Salud, Disponibilidad de Infraestructura y Observabilidad
## Hoja de Ruta Frontend (`apps/chatbot/web/portal/docs/roadmap/01-cu-01-system-health.md`)

| Atributo | Detalle |
| :--- | :--- |
| **Identificador** | **CU-01** |
| **Paso del Backend Walkthrough** | **Step 1: Health & Interactive Documentation** ([`AI_CONVERSATION_PLATFORM_API.README.md`](file:///Users/angel.szymczak/Vaults/Harvis/300-MEMORIA_DIGITAL/475-Sites/AngelSolutions/Company/platform/convo/chatbot-ai-rag-langchain/apps/chatbot/web/portal/docs/AI_CONVERSATION_PLATFORM_API.README.md#L292)) |
| **Slice Backend Vinculado** | Slice 1 (Hexagonal Base) & Slice 10 (Observability) |
| **Endpoints Clave** | `GET /health`, `/docs` (Swagger UI), `/redoc` (ReDoc) |
| **Estado de Implementación** | 🟡 Especificado (Listo para TDD) |

---

## 🎯 1. Objetivos de Negocio y Experiencia de Usuario (UX)

### 1.1 El Problema
Los operadores y usuarios corporativos que interactúan con el portal conversacional necesitan saber de inmediato si la plataforma está disponible para procesar preguntas, si algún servicio dependiente (MSSQL, RabbitMQ, Worker de IA) está degradado o si la conexión de red local se ha interrumpido, evitando frustraciones por intentos fallidos de envío de mensajes.

### 1.2 La Solución Neubrutalism 3D
1. **`SystemStatusPill` (Componente de Cabecera):**
   - Un botón/pill táctil de alta visibilidad ubicado en la barra superior (topbar) del portal.
   - Borde negro sólido de `2px`, sombra dura de `3px 3px 0px #000`, y un punto indicador LED con micro-animación pulsante continua.
   - Estados visuales:
     - 🟢 **ONLINE / HEALTHY:** Fondo verde menta suave (`#D1FAE5`), punto verde esmeralda brillante (`#10B981`) pulsando a `1.5s`.
     - 🟡 **DEGRADED:** Fondo ámbar suave (`#FEF3C7`), punto ámbar (`#F59E0B`) con pulso rápido (`0.8s`).
     - 🔴 **DOWN / DISCONNECTED:** Fondo rojo suave (`#FEE2E2`), punto rojo alerta (`#EF4444`) fijo y texto "SIN CONEXIÓN".
     - ⚪ **CHECKING:** Fondo gris pizarra (`#F1F5F9`), animación de giro mecánico en icono.
2. **`SystemStatusModal` (Panel de Diagnóstico Táctil):**
   - Al hacer clic en el `SystemStatusPill`, se despliega una tarjeta modal Neubrutalism 3D con sombra proyectada de `6px 6px 0px #000` y borde negro de `3px`.
   - Presenta la latencia de respuesta en milisegundos (`ms`), tiempo de última sincronización, enlaces rápidos directos a la documentación interactiva del backend (`/docs` y `/redoc`), y el desglose de salud de los subsistemas.

---

## 🔌 2. Contrato de Integración API

### 2.1 Endpoint de Verificación de Salud
- **Método:** `GET`
- **Ruta:** `/health`
- **Headers Requeridos:**
  ```http
  Accept: application/json
  ```
- **Sin Autenticación Requerida:** Endpoint público para probes de liveness y readiness.

### 2.2 Respuestas HTTP del Backend Actual

#### 🟢 200 OK (Servicio Operativo)
```json
{
  "status": "ok"
}
```

#### 🔴 503 Service Unavailable / Network Error
Cuando el backend está apagado, el proxy falla o la conexión es rechazada (`ECONNREFUSED` / Timeout > 5000ms):
- El cliente frontend captura el error de red o código 503 y transforma el estado en `DOWN`.

---

## 🏛️ 3. Arquitectura Frontend (Clean Architecture)

El caso de uso se organiza en las 4 capas de Clean Architecture:

```
src/
├── domain/health/
│   ├── HealthStatus.ts            # Value Object: 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'CHECKING'
│   └── SystemHealth.ts            # Entidad con latencia, timestamp y checks
├── application/health/
│   ├── useSystemHealth.ts         # Hook reactivo (TanStack Query + polling inteligente)
│   └── healthQueries.ts           # Configuración de queries y staleTime
├── infrastructure/api/
│   └── healthClient.ts            # Adaptador HTTP con Axios/Fetch tipado y timeout de 5s
└── presentation/
    ├── components/ui/
    │   ├── SystemStatusPill.tsx   # Átomo Neubrutalism 3D con LED pulsante
    │   └── SystemStatusModal.tsx  # Modal neubrutalista con métricas y enlaces
    └── layouts/DashboardHeader.tsx # Integración del pill en el topbar global
```

### 3.1 Capa de Dominio (`domain/health/`)
```typescript
// domain/health/HealthStatus.ts
export type HealthStatusLevel = 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'CHECKING';

export interface ComponentHealthCheck {
  name: string;
  status: HealthStatusLevel;
  latencyMs?: number;
  message?: string;
}

// domain/health/SystemHealth.ts
export class SystemHealth {
  constructor(
    public readonly status: HealthStatusLevel,
    public readonly latencyMs: number,
    public readonly checkedAt: Date,
    public readonly components: ComponentHealthCheck[] = []
  ) {}

  get isOperational(): boolean {
    return this.status === 'HEALTHY' || this.status === 'DEGRADED';
  }

  get statusColor(): string {
    switch (this.status) {
      case 'HEALTHY':
        return '#10B981'; // Emerald 500
      case 'DEGRADED':
        return '#F59E0B'; // Amber 500
      case 'DOWN':
        return '#EF4444'; // Red 500
      case 'CHECKING':
      default:
        return '#64748B'; // Slate 500
    }
  }
}
```

### 3.2 Capa de Aplicación (`application/health/`)
- Utiliza **TanStack Query (`@tanstack/react-query`)**:
  - `refetchInterval`: 30,000 ms (30 segundos en segundo plano).
  - `staleTime`: 15,000 ms.
  - `retry`: 2 intentos antes de declarar estado `DOWN`.
  - Detección de reconexión de ventana (`refetchOnWindowFocus: true`).

---

## 🧪 4. Especificación BDD en Gherkin (`.feature`)

Archivo: `tests/e2e/features/cu-01-system-health.feature`

```gherkin
Feature: CU-01 - Monitor de Salud y Disponibilidad del Sistema
  Como operador del portal
  Quiero supervisar el estado de salud y conectividad de la plataforma en tiempo real
  Para saber de inmediato si los servicios están listos para atender conversaciones

  Background:
    Given que el navegador carga la aplicación en el portal "/dashboard"

  Scenario: Verificación de salud exitosa con backend operativo (Happy Path)
    Given el backend responde exitosamente a "GET /health" con status "ok" en 120ms
    Then visualizo el indicador "SystemStatusPill" en el encabezado
    And el texto del indicador muestra "SISTEMA ONLINE"
    And el LED de estado tiene fondo verde esmeralda con borde negro de 2px
    And la sombra proyectada es de "3px 3px 0px #000000"

  Scenario: Detección y visualización de caída de servicio (Service Down)
    Given el backend no responde a "GET /health" o retorna error 503
    Then el indicador "SystemStatusPill" cambia a fondo rojo suave
    And el texto del indicador muestra "SIN CONEXIÓN"
    And el LED muestra color rojo de advertencia sin animación de pulso

  Scenario: Apertura del panel de diagnóstico detallado
    Given el indicador muestra estado "SISTEMA ONLINE"
    When hago clic en el componente "SystemStatusPill"
    Then se abre el modal "SystemStatusModal" con elevación 3D y borde negro de 3px
    And visualizo la latencia registrada en milisegundos
    And visualizo un enlace directo a la documentación "Swagger UI (/docs)"
    And visualizo un enlace directo a la especificación "ReDoc (/redoc)"
```

---

## 🛠️ 5. Mock Service Worker (MSW) Handlers & Fixtures

Estos handlers permiten desarrollar y probar unitariamente los componentes sin necesidad de ejecutar el backend real ni Docker:

```typescript
// src/mocks/handlers/healthHandlers.ts
import { http, HttpResponse, delay } from 'msw';

export const healthHandlers = [
  // Handler 1: Estado Saludable (Normal)
  http.get('http://localhost:8000/health', async () => {
    await delay(100);
    return HttpResponse.json({ status: 'ok' }, { status: 200 });
  }),

  // Handler de utilidad para simular caída en tests
  http.get('http://localhost:8000/health-error', async () => {
    await delay(50);
    return new HttpResponse(null, { status: 503, statusText: 'Service Unavailable' });
  }),

  // Handler de utilidad para simular timeout
  http.get('http://localhost:8000/health-timeout', async () => {
    await delay(6000);
    return HttpResponse.json({ status: 'ok' });
  }),
];
```

---

## 🔬 6. Estrategia TDD (Vitest & React Testing Library)

Antes de escribir el componente de presentación, se desarrollan los siguientes tests:

1. **`SystemHealth.test.ts` (Unit Test):**
   - Valida la instanciación del Value Object con diferentes estados.
   - Verifica que `isOperational` sea `true` únicamente para `HEALTHY` y `DEGRADED`.
   - Verifica los colores hexadecimales Neubrutalism asociados a cada estado.
2. **`useSystemHealth.test.ts` (Hook Test con MSW):**
   - Valida la transición inicial de `CHECKING` a `HEALTHY` tras resolver `GET /health`.
   - Mide el cálculo de latencia (`latencyMs > 0`).
   - Verifica el comportamiento ante fallo de red: reintento y posterior transición a `DOWN`.
3. **`SystemStatusPill.test.tsx` (Component Test):**
   - Verifica la presencia de las clases Tailwind de Neubrutalism (`border-2 border-black`, `shadow-[3px_3px_0px_#000000]`).
   - Verifica el atributo ARIA `role="status"` y `aria-live="polite"` para accesibilidad.
   - Simula clic y comprueba que se dispara el callback para abrir el modal de diagnóstico.

---

## 🚀 7. Propuestas de Mejora para el Backend (Feedback / RFC)

Durante el análisis del endpoint actual `GET /health` frente a las necesidades reales del operador en el frontend, se identificaron las siguientes oportunidades de mejora para el equipo de backend:

### RFC-01: Health Check Detallado con Desglose de Componentes
- **Situación Actual:** `GET /health` solo retorna `{"status": "ok"}`. No valida activamente la conectividad real con SQL Server 2022, el canal de RabbitMQ ni el estado de los workers.
- **Propuesta:** Ampliar la respuesta de `/health` (o exponer un sub-recurso `GET /health/details`) que ejecute un ping ligero a cada componente dependiente conforme al estándar [IETF Health Check Draft](https://datatracker.ietf.org/doc/html/draft-inadarei-api-health-check):
  ```json
  {
    "status": "healthy",
    "version": "1.0.0",
    "timestamp": "2026-10-05T13:30:00Z",
    "uptime_seconds": 86400,
    "checks": {
      "mssql": {
        "status": "healthy",
        "latency_ms": 4,
        "database": "ChatbotDB"
      },
      "rabbitmq": {
        "status": "healthy",
        "latency_ms": 2,
        "exchange": "conversation.events"
      },
      "worker": {
        "status": "healthy",
        "active_consumers": 2,
        "queue_depth": 0
      }
    }
  }
  ```
- **Beneficio Frontend:** Permite al `SystemStatusModal` encender pills individuales para Base de Datos y Broker, alertando al usuario si el chat está lento o encolado antes de que falle.

### RFC-02: Separación de Probes (`/health/live` vs `/health/ready`)
- **Situación Actual:** Un solo endpoint `/health`.
- **Propuesta:** 
  - `GET /health/live` (Liveness): Responde `200` instantáneo si el proceso Python está vivo (útil para orquestadores).
  - `GET /health/ready` (Readiness): Responde `200` solo si las conexiones a MSSQL y RabbitMQ están listas para aceptar tráfico. Si la base de datos se reinicia, responde `503 Service Unavailable`.
- **Beneficio:** Evita que el portal envíe peticiones de creación de conversación a un backend que aún no ha establecido el pool de conexiones SQL.

### RFC-03: Inclusión del Hash de Versión y Entorno en Headers
- **Propuesta:** Enviar en las cabeceras de respuesta de `/health`:
  - `X-App-Version: 1.0.0`
  - `X-Environment: development | staging | production`
- **Beneficio Frontend:** Permite al portal advertir al usuario si está ejecutando una versión desactualizada en caché del cliente y requiere refrescar la página.

---

## ✅ 8. Criterios de Aceptación (Definition of Done - DoD)

- [ ] Value Object `SystemHealth` y tipos creados en `domain/health/` con 100% cobertura unitaria.
- [ ] Cliente HTTP tipado con timeout de 5s implementado en `infrastructure/api/healthClient.ts`.
- [ ] Hook `useSystemHealth` con TanStack Query y pruebas en `application/health/`.
- [ ] Componente `SystemStatusPill` maquetado con Neubrutalism 3D, LED pulsante y soporte para modo oscuro.
- [ ] Componente `SystemStatusModal` interactivo con enlaces a `/docs` y `/redoc`.
- [ ] Handlers de MSW configurados y testeados en `src/mocks/`.
- [ ] Especificación `.feature` validada o lista para ejecución en Playwright.
