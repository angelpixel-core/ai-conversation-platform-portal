# 📂 Catálogo de Prompts y Playbooks para Casos de Uso (Frontend Portal)

> **Directorio:** `.agents/prompts/`  
> **Proyecto:** Frontend Web Portal (`apps/chatbot/web/portal`)

Este directorio contiene los playbooks, directrices y plantillas reutilizables para orquestar auditorías, refactorizaciones y desarrollos de casos de uso en el portal.

---

## 📑 Índice de Archivos

| Archivo | Tipo | Descripción |
| :--- | :--- | :--- |
| [`use_case_audit_and_refactor_playbook.md`](file:///Users/angel.szymczak/Vaults/Harvis/300-MEMORIA_DIGITAL/475-Sites/AngelSolutions/Company/platform/convo/chatbot-ai-rag-langchain/apps/chatbot/web/portal/.agents/prompts/use_case_audit_and_refactor_playbook.md) | Playbook Maestro | Metodología estándar en 7 fases (Auditoría, Clean Architecture, Neubrutalismo 3D, Tolerant Reader, Vitest, Puppeteer, RFC, Git). |
| [`../rules/use-case-audit-standards.md`](file:///Users/angel.szymczak/Vaults/Harvis/300-MEMORIA_DIGITAL/475-Sites/AngelSolutions/Company/platform/convo/chatbot-ai-rag-langchain/apps/chatbot/web/portal/.agents/rules/use-case-audit-standards.md) | Regla de Espacio de Trabajo | Restricciones arquitectónicas, de diseño y de calidad cargadas automáticamente por Antigravity. |
| [`../rules/git-workflow.md`](file:///Users/angel.szymczak/Vaults/Harvis/300-MEMORIA_DIGITAL/475-Sites/AngelSolutions/Company/platform/convo/chatbot-ai-rag-langchain/apps/chatbot/web/portal/.agents/rules/git-workflow.md) | Regla Git | Estrategia de ramas (`feat/*` ➔ `development` vía Squash, `development` ➔ `main` vía Merge Commit). |

---

## 🗺️ Matriz de Casos de Uso (CU-01 a CU-10)

Esta tabla enumera los 10 casos de uso del sistema, su mapeo con el backend y el estado de implementación:

| Caso de Uso | Nombre Funcional | Endpoint Backend | Ruta Portal | RFC Vinculado | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CU-01** | Monitor de Salud y Disponibilidad | `GET /health` | `/dashboard` | `RFC-31` | ✅ Completado |
| **CU-02** | Contexto y Selector Multi-Tenant | `GET,POST /admin/tenants` | `/` y `/dashboard` | `RFC-32` | ✅ Completado |
| **CU-03** | Consola Conversacional con Idempotencia | `POST /chat/messages` | `/chat` | `RFC-33` | ⏳ Pendiente |
| **CU-04** | Monitor de Despacho Asíncrono y Outbox | `GET /messages/{id}/status` | `/chat` | `RFC-34` | ⏳ Pendiente |
| **CU-05** | Dashboard de Gobernanza de Tokens y Cuotas | `GET /admin/tenants/{id}/budget` | `/governance/budget` | `RFC-35` | ⏳ Pendiente |
| **CU-06** | Centro de Aprobaciones Human-in-the-Loop | `GET,POST /approvals` | `/approvals` | `RFC-36` | ⏳ Pendiente |
| **CU-07** | Gestor de Base de Conocimiento y RAG | `POST /documents`, `/chunks` | `/knowledge` | `RFC-37` | ⏳ Pendiente |
| **CU-08** | Streaming en Tiempo Real de Tokens (SSE) | `GET /chat/stream` | `/chat` | `RFC-38` | ⏳ Pendiente |
| **CU-09** | Grafo Visual de Workflows Multi-Agente | `GET /workflows/{id}/graph` | `/workflows` | `RFC-39` | ⏳ Pendiente |
| **CU-10** | Centro de Observabilidad y Guardrails | `GET /security/incidents` | `/security` | `RFC-40` | ⏳ Pendiente |

---

## 🚀 Guía Rápida de Invocación con `/plan`

Para iniciar cualquier caso de uso futuro (por ejemplo, `CU-03`), escribe en el chat:

```markdown
/plan
Por favor, audita y refactoriza el siguiente caso de uso aplicando el playbook maestro:
- Caso de Uso: CU-03 - Consola Conversacional con Idempotencia Resiliente
- Slug: chat-idempotency
- Endpoint Backend: /chat/messages
- Ruta Portal: /chat
- RFC Objetivo: RFC-33

Utiliza las directrices de:
1. .agents/prompts/use_case_audit_and_refactor_playbook.md
2. .agents/rules/use-case-audit-standards.md
3. .agents/rules/git-workflow.md
```
