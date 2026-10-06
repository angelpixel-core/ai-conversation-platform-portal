# 🗺️ Roadmap de Implementación Frontend - AI Conversation Portal
## `apps/chatbot/web/portal`

Este directorio almacena la hoja de ruta y las especificaciones técnicas ejecutables para la implementación del portal web (`web/portal`) en **Next.js 14/15**, **TypeScript** y **Tailwind CSS**.

El roadmap mantiene una **paridad estricta 1:1** con los 10 pasos demostrados en la guía de ejecución en vivo del backend ([`AI_CONVERSATION_PLATFORM_API.README.md`](file:///Users/angel.szymczak/Vaults/Harvis/300-MEMORIA_DIGITAL/475-Sites/AngelSolutions/Company/platform/convo/chatbot-ai-rag-langchain/apps/chatbot/web/portal/docs/AI_CONVERSATION_PLATFORM_API.README.md)), el contrato OpenAPI en [ReDoc](https://angelpixel-core.github.io/ai-conversation-platform) y el Documento Maestro ([`USE_CASES_AND_SPECS.md`](file:///Users/angel.szymczak/Vaults/Harvis/300-MEMORIA_DIGITAL/475-Sites/AngelSolutions/Company/platform/convo/chatbot-ai-rag-langchain/apps/chatbot/web/portal/docs/USE_CASES_AND_SPECS.md)).

---

## 📊 Matriz de Trazabilidad y Estado de Casos de Uso

| ID | Documento de Especificación | Caso de Uso | Step Backend Walkthrough | Slice Backend | Endpoints Clave | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **01** | [`01-cu-01-system-health.md`](file:///Users/angel.szymczak/Vaults/Harvis/300-MEMORIA_DIGITAL/475-Sites/AngelSolutions/Company/platform/convo/chatbot-ai-rag-langchain/apps/chatbot/web/portal/docs/roadmap/01-cu-01-system-health.md) | **CU-01: Monitor de Salud y Disponibilidad** | Step 1: Health & Docs | Base Hexagonal | `GET /health` | 🟡 Especificado |
| **02** | [`02-cu-02-tenant-isolation.md`](file:///Users/angel.szymczak/Vaults/Harvis/300-MEMORIA_DIGITAL/475-Sites/AngelSolutions/Company/platform/convo/chatbot-ai-rag-langchain/apps/chatbot/web/portal/docs/roadmap/02-cu-02-tenant-isolation.md) | **CU-02: Selector de Tenant y Aislamiento** | Step 2: Multi-Tenancy | Slice 6 | `GET /admin/tenants`, Header `X-Tenant-Id` | 🟡 Especificado |
| **03** | [`03-cu-03-chat-idempotency.md`](file:///Users/angel.szymczak/Vaults/Harvis/300-MEMORIA_DIGITAL/475-Sites/AngelSolutions/Company/platform/convo/chatbot-ai-rag-langchain/apps/chatbot/web/portal/docs/roadmap/03-cu-03-chat-idempotency.md) | **CU-03: Consola Conversacional e Idempotencia** | Step 3: Idempotency | Slices 1, 2, 5 | `POST /conversations`, `POST .../messages` | 🟡 Especificado |
| **04** | [`04-cu-04-outbox-worker-monitor.md`](file:///Users/angel.szymczak/Vaults/Harvis/300-MEMORIA_DIGITAL/475-Sites/AngelSolutions/Company/platform/convo/chatbot-ai-rag-langchain/apps/chatbot/web/portal/docs/roadmap/04-cu-04-outbox-worker-monitor.md) | **CU-04: Monitor de Despacho Asíncrono Outbox** | Step 6: Decoupled Worker | Slice 4 | RabbitMQ/Outbox Domain Events | 🟡 Especificado |
| **05** | [`05-cu-05-governance-budget.md`](file:///Users/angel.szymczak/Vaults/Harvis/300-MEMORIA_DIGITAL/475-Sites/AngelSolutions/Company/platform/convo/chatbot-ai-rag-langchain/apps/chatbot/web/portal/docs/roadmap/05-cu-05-governance-budget.md) | **CU-05: Dashboard de Cuotas y Presupuestos** | Step 5: Tenant Governance | Slice 6 | `/admin/tenants/{id}/budget`, `/policy`, `/reserve` | 🟡 Especificado |
| **06** | `06-cu-06-hitl-approvals.md` | **CU-06: Centro de Aprobaciones Human-in-the-Loop** | Step 8: Tool Calling & HITL | Slice 8 | `POST /approvals`, `GET .../pending`, `POST .../decision` | ⚪ Pendiente |
| **07** | `07-cu-07-hybrid-rag-knowledge.md` | **CU-07: Ingesta de Documentos y RAG Híbrido** | Step 7: Knowledge & RAG | Slice 7 | `POST /documents`, `GET .../status`, `event: citation` | ⚪ Pendiente |
| **08** | `08-cu-08-resilient-sse-streaming.md` | **CU-08: Streaming en Tiempo Real Resiliente (SSE)** | Step 4: SSE & Recovery | Slices 2, 5 | `GET /conversations/{id}/stream`, `Last-Event-ID` | ⚪ Pendiente |
| **09** | `09-cu-09-multi-agent-workflows.md` | **CU-09: Grafo de Workflows Multi-Agente** | Step 9: State Graphs | Slice 9 | `POST /workflows`, `GET .../stream`, `.../checkpoints` | ⚪ Pendiente |
| **10** | `10-cu-10-ai-guardrails-observability.md` | **CU-10: Guardrails de Seguridad y Observabilidad** | Step 10: AI Governance | Slice 10 | `/incidents`, `/governance/metrics`, `X-Trace-ID` | ⚪ Pendiente |

*Leyenda: ⚪ Pendiente de especificación · 🟡 Especificado (Listo para TDD) · 🔵 En Desarrollo · 🟢 Validado (Tests pasando).*

---

## 🏛️ Estándar de Estructura por Documento

Cada documento de especificación técnica en esta carpeta debe respetar obligatoriamente las siguientes **7 secciones**:

1. **Objetivos de Negocio y Experiencia de Usuario (UX):** Qué problema resuelve el caso de uso y cómo se percibe en la interfaz Neubrutalism 3D.
2. **Contrato de Integración API:** Headers requeridos (`X-Tenant-Id`, `Idempotency-Key`, etc.), Request/Response Schemas, eventos SSE y códigos de error HTTP esperados.
3. **Arquitectura Frontend (Clean Architecture):**
   - **Dominio (`domain/`):** Entidades puras y Value Objects.
   - **Aplicación (`application/`):** Hooks orquestadores y manejo de estado.
   - **Infraestructura (`infrastructure/`):** Clientes HTTP tipados, parsers de SSE y storage.
   - **Presentación (`presentation/`):** Componentes atómicos e interactivos con estética Neubrutalism 3D.
4. **Especificación BDD en Gherkin (`.feature`):** Escenarios ejecutables en Playwright-BDD (Happy Path, Edge Cases, Errores de Red).
5. **Mock Service Worker (MSW) Handlers & Fixtures:** Mocks de red independientes para permitir desarrollo y tests aislados del backend.
6. **Estrategia TDD (Vitest & Testing Library):** Casos de prueba unitarios y de componentes a escribir antes del código de producción.
7. **🚀 Propuestas de Mejora para el Backend (Feedback / RFC):** Hallazgos, sugerencias de nuevos campos o endpoints para optimizar el backend a futuro.
8. **Criterios de Aceptación (Definition of Done - DoD):** Lista de verificación para dar por concluido el caso de uso.

---

## 🎨 Principios de Diseño: Neubrutalism 3D

Todas las pantallas y componentes implementados a partir de este roadmap deben cumplir los principios definidos en [`USE_CASES_AND_SPECS.md`](file:///Users/angel.szymczak/Vaults/Harvis/300-MEMORIA_DIGITAL/475-Sites/AngelSolutions/Company/platform/convo/chatbot-ai-rag-langchain/apps/chatbot/web/portal/docs/USE_CASES_AND_SPECS.md):
- **Bordes:** `border-2` o `border-3 border-black dark:border-white`.
- **Sombras:** Desplazamiento rígido sin blur (`box-shadow: 4px 4px 0px #000;` para botones/inputs, `6px 6px 0px #000;` para tarjetas/modales).
- **Interacción Táctil:** Elevación en `:hover` (`translate(-1px, -1px)`) y sensación de botón mecánico presionado en `:active` (`translate(2px, 2px)` con sombra reducida).
- **Tipografía y Paleta:** Alto contraste, fuentes sans-serif nítidas, base papel cálido (`#FAF9F6`) o pizarra profunda (`#0F172A`) con acentos vibrantes (azul eléctrico `#3B82F6`, verde esmeralda `#10B981`, amarillo cyber `#FBBF24`, rojo alerta `#EF4444`).
