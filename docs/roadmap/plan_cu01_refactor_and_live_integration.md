# 🛠️ Plan de Refactor, Rediseño e Integración Real: CU-01 Monitor de Salud y Diagnóstico

Este plan aborda la primera etapa del ciclo de refactorización integral caso por caso, centrándose exclusivamente en **CU-01: Monitor de Salud, Disponibilidad de Infraestructura y Observabilidad**, conectándolo directamente con el backend FastAPI que se encuentra activo en `http://localhost:8000`.

---

## 🔍 Diagnóstico Actual del Entorno

1. **Estado del Backend (`localhost:8000`):**
   - El servicio FastAPI/Uvicorn está **activo y respondiendo** `HTTP 200 OK`.
   - Respuesta actual de `GET /health`:
     ```json
     {
       "status": "ok"
     }
     ```
   - Swagger UI disponible en `http://localhost:8000/docs`.
   - ReDoc disponible en `http://localhost:8000/redoc`.
   - Contenedores Docker de soporte activos: `chatbot_db` (MSSQL puerto 1433) y `chatbot_broker` (RabbitMQ puerto 5672).

2. **Diagnóstico del Frontend (Portal):**
   - El portal tenía por defecto `NEXT_PUBLIC_USE_MOCKS=true` en `.env.local` y `container.ts`, por lo que el `SystemStatusPill` consumía `MockHealthGateway` sin consultar el backend real.
   - El modelo de dominio `SystemHealth` no guardaba el payload crudo ni indicaba si la respuesta provenía de `LIVE API` o `MOCK`.
   - La interfaz no permitía alternar en caliente entre el backend real y el mock sin reiniciar el servidor Next.js.

---

## 🎯 Objetivos de la Refactorización (CU-01)

### 1. Refactor de Código & Resiliencia
- **Alternancia Dinámica de Modo (Live API vs Mock Mode):**
  - Implementar un store de sesión ligero (`runtimeEnvironmentStore.ts`) que permita al usuario conmutar entre **`LIVE API (http://localhost:8000)`** y **`MOCK MODE`** directamente desde la interfaz, sin reiniciar el servidor.
- **Evolución del Adaptador `HttpHealthAdapter.ts`:**
  - Agregar `AbortController` con timeout de 3.5 segundos para evitar bloqueos si el backend no responde.
  - Medición precisa de latencia de red de ida y vuelta (RTT) en milisegundos.
  - Detección del contrato: Identificar si el backend devuelve el payload simple `{"status": "ok"}` o el contrato enriquecido con checks de infraestructura.
  - Almacenar el `rawPayload` para inspección forense en la interfaz.
- **Ampliación de la Entidad de Dominio `SystemHealth.ts`:**
  - Propiedades: `mode: 'LIVE' | 'MOCK'`, `rawPayload?: Record<string, unknown>`, `isRFCCompliant: boolean`, `serverTime?: string`.
  - Getters para evaluar la calidad de la latencia (`latencyQuality: 'EXCELLENT' | 'GOOD' | 'POOR'`).

### 2. Rediseño Visual 3D Neubrutalism & UX
- **`SystemStatusPill.tsx` (TopBar Header):**
  - Badge de alto contraste táctil (`border-2 border-black`, `shadow-neo-sm`).
  - Badge de origen: `[LIVE]` (esmeralda/negro) o `[MOCK]` (violeta/negro).
  - Indicador de latencia en milisegundos en tiempo real (`12ms`).
  - Micro-animación de LED pulsante diferenciada por estado (Verde, Ámbar, Rojo).
- **`SystemStatusModal.tsx` (Consola de Diagnóstico & Telemetría):**
  - **Selector Táctil de Modo:** Botones estilo mechanical switch `[● MODO EN VIVO (8000)]` vs `[○ MODO SIMULACIÓN]` para alternar y probar en tiempo real.
  - **Medidor Visual de Calidad de Señal:** Barra de progreso de latencia con umbrales visuales (<50ms Verde, <200ms Ámbar, >200ms Rojo).
  - **Tarjetas Táctiles de Subsistemas:**
    - **API Engine (FastAPI / Uvicorn):** Estado operativo, latencia real y endpoint consultado.
    - **Base de Datos (MSSQL Server):** Puerto 1433, aviso de estado reportado vs inferido.
    - **Message Broker (RabbitMQ):** Puerto 5672, estado de la cola de eventos.
  - **Visor del JSON Crudo del Backend:** Caja de código con resaltado y botón de copiado rápido (`{"status": "ok"}`).
  - **Acceso Rápido a Documentación:** Botones táctiles a `/docs` (Swagger) y `/redoc` con indicador visual de enlace externo.
  - **Acción Manual de Refresco:** Botón táctil "Refrescar Estado" con spinner mecánico.

### 3. Documentación & Solicitud de Mejoras al Backend (RFC-31)
- Crear el documento [`docs/rfcs/RFC-31-backend-health-observability-contract.md`](file:///Users/angel.szymczak/Vaults/Harvis/300-MEMORIA_DIGITAL/475-Sites/AngelSolutions/Company/platform/convo/chatbot-ai-rag-langchain/apps/chatbot/web/portal/docs/rfcs/RFC-31-backend-health-observability-contract.md):
  - Explicar la limitación actual del payload simple `{"status": "ok"}`.
  - Proponer el esquema JSON para que el engine verifique activamente la conexión a MSSQL y RabbitMQ antes de responder:
    ```json
    {
      "status": "healthy",
      "version": "1.0.0",
      "uptime_seconds": 3600,
      "checks": {
        "api": { "status": "healthy", "latency_ms": 1 },
        "database": { "status": "healthy", "latency_ms": 6, "engine": "mssql" },
        "broker": { "status": "healthy", "latency_ms": 3, "engine": "rabbitmq" }
      }
    }
    ```
  - Proponer endpoints de liveness y readiness (`/health/live`, `/health/ready`).

---

## 📋 Plan de Ejecución Paso a Paso

1. **Fase 1 (Dominio):**
   - Actualizar `SystemHealth.ts` y sus pruebas unitarias `SystemHealth.test.ts`.
2. **Fase 2 (Infraestructura & Almacén de Entorno):**
   - Crear `src/infrastructure/storage/runtimeEnvironmentStore.ts` para alternar Live API y Mock.
   - Refactorizar `src/infrastructure/api/HttpHealthAdapter.ts` con timeout, captura de RTT y payload crudo.
   - Actualizar `HttpHealthAdapter.test.ts`.
   - Conectar `container.ts` con la resolución dinámica de cliente.
3. **Fase 3 (Aplicación):**
   - Actualizar `src/application/health/useSystemHealth.ts` para soportar refetch manual forzado y cambio de entorno reactivo.
4. **Fase 4 (Presentación & Rediseño 3D Neubrutalism):**
   - Rediseñar `src/presentation/components/health/SystemStatusPill.tsx` y pruebas.
   - Rediseñar `src/presentation/components/health/SystemStatusModal.tsx` con switcher Live/Mock, visor JSON crudo y tarjetas de infraestructura.
   - Actualizar `src/presentation/layouts/DashboardHeader.tsx`.
5. **Fase 5 (Validación & Evidencias):**
   - Ejecutar la suite completa de pruebas unitarias (`npm test`).
   - Generar capturas de pantalla de la nueva consola de telemetría de salud conectada al backend real (`http://localhost:8000/health`).
6. **Fase 6 (RFC Backend):**
   - Redactar `docs/rfcs/RFC-31-backend-health-observability-contract.md`.
