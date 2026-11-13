# ARTICLE-CU03: Consola Conversacional con Idempotencia Resiliente y Arquitectura Hexagonal

> Artículo técnico del caso de uso CU-03 basado en la plantilla de arquitectura y DDD de la plataforma.

* **Artículo ID:** ARTICLE-CU03
* **User Story:** CU-03: Consola Conversacional con Idempotencia Resiliente
* **Bounded Context:** `conversations` / `chat-platform`
* **Tipo de Slice:** Vertical Slice Completo (Command de Envío, Query de Historial, Tolerant Reader y Presentación Neubrutalista 3D)
* **Rama de Trabajo:** `feat/03-chat-idempotency`
* **Squash Commit en development:** `5c9eab1`
* **Fecha:** 2026-10-15
* **Autor / Tech Lead:** Equipo Frontend Portal (Portal Web & Clean Architecture)

---

## 1. Resumen Ejecutivo y Problema de Negocio

En entornos empresariales que consumen modelos fundacionales de lenguaje (LLMs) y pipelines RAG mediante arquitecturas multi-tenant, las redes móviles e inestables presentan dos riesgos operativos críticos:
1. **Doble Envío Accidental (*Double Submit*):** Cuando el usuario hace clic múltiples veces por impaciencia, disparando invocaciones duplicadas al agente LangChain que consumen tokens innecesarios, degradan la cuota de gasto del tenant y saturan la cola de inferencia.
2. **Reintentos Ciegos ante Desconexiones de Red (*Network Retries*):** Si la respuesta HTTP del servidor se pierde por un corte transitorio o timeout de socket, los reintentos no deterministas pueden generar inconsistencias en la memoria conversacional o duplicar cargos en servicios transaccionales.

**CU-03** resuelve esta problemática de extremo a extremo mediante:
- **Deduplicación Estricta:** Generación obligatoria de cabeceras `X-Idempotency-Key` bajo el estándar RFC 4122 (UUIDv4) en cada turno de usuario.
- **Invariante de Alternancia de Turnos:** Bloqueo preventivo en interfaz y validación de dominio que impide turnos consecutivos sin respuesta del asistente.
- **Micro-interacciones Mecánicas Táctiles:** Una consola de chat diseñada bajo **Neubrutalismo 3D**, con botones de pulsación física, banner reactivo de Turno Protegido (*Turn Protection Guard*) y micro-badges de trazabilidad contractual.
- **Patrón Tolerant Reader:** Desacoplamiento total del frontend mediante adaptación tolerante a discrepancias de API backend sin tiempo de inactividad.

---

## 2. Diseño Arquitectónico del Vertical Slice

El vertical slice se estructura respetando rigurosamente los principios de **Clean Architecture, CQRS y DDD**:

```mermaid
flowchart TD
    subgraph Presentation ["Presentation Layer (React / Neubrutalism 3D)"]
        UI["ChatConsole & ChatInput\n(Mechanical Press, Turn Lock Guard)"]
        MODAL["CreateConversationModal\n(Accessible Dialog, Title Validation)"]
    end

    subgraph Application ["Application Layer (CQRS & Hooks)"]
        HOOK["useSendMessage & useCreateConversation\n(Optimistic UI, Retry Banner)"]
        CMD_SEND["SendMessageUseCase\n(Command)"]
        CMD_CREATE["CreateConversationUseCase\n(Command)"]
        QRY_GET["GetConversationUseCase\n(Query)"]
    end

    subgraph Domain ["Domain Layer (Pure DDD)"]
        AGG["ConversationAggregate\n(canAppendUserMessage, appendMessage)"]
        VO_ID["ConversationId & IdempotencyKey\n(UUIDv4 Invariants)"]
        ERR["ConversationErrors\n(IdempotencyConflictError, TurnInvariantError)"]
    end

    subgraph SecondaryPorts ["Secondary Port (SPI)"]
        PORT["ConversationGateway\n(getConversation, sendMessage, createConversation)"]
    end

    subgraph Infrastructure ["Infrastructure Layer (Driven Adapters)"]
        HTTP["HttpConversationAdapter\n(Tolerant Reader, Header Injection, Proxy Fallback)"]
        MOCK["MockConversationGateway\n(Enterprise Cloud Catalog & Deterministic Latency)"]
        CONTAINER["Dynamic Container DI\n(runtimeEnvironmentStore.getMode())"]
    end

    UI --> HOOK
    MODAL --> HOOK
    HOOK --> CMD_SEND
    HOOK --> CMD_CREATE
    HOOK --> QRY_GET

    CMD_SEND --> PORT
    CMD_CREATE --> PORT
    QRY_GET --> PORT

    CMD_SEND -.uses.-> AGG
    CMD_SEND -.uses.-> VO_ID
    CMD_SEND -.catches.-> ERR

    PORT <|.. HTTP
    PORT <|.. MOCK
    CONTAINER --> PORT
```

### Componentes Clave del Slice

* **Punto de Entrada (Driver Adapter / UI):** 
  - [`src/presentation/components/chat/ChatConsole.tsx`](file:///Users/angel.szymczak/Vaults/Harvis/300-MEMORIA_DIGITAL/475-Sites/AngelSolutions/Company/platform/convo/chatbot-ai-rag-langchain/apps/chatbot/web/portal/src/presentation/components/chat/ChatConsole.tsx)
  - [`src/presentation/components/chat/ChatInput.tsx`](file:///Users/angel.szymczak/Vaults/Harvis/300-MEMORIA_DIGITAL/475-Sites/AngelSolutions/Company/platform/convo/chatbot-ai-rag-langchain/apps/chatbot/web/portal/src/presentation/components/chat/ChatInput.tsx)
  - [`src/presentation/components/chat/CreateConversationModal.tsx`](file:///Users/angel.szymczak/Vaults/Harvis/300-MEMORIA_DIGITAL/475-Sites/AngelSolutions/Company/platform/convo/chatbot-ai-rag-langchain/apps/chatbot/web/portal/src/presentation/components/chat/CreateConversationModal.tsx)
* **Mensajes de Aplicación (Commands & Queries):**
  - [`src/application/conversations/commands/SendMessageUseCase.ts`](file:///Users/angel.szymczak/Vaults/Harvis/300-MEMORIA_DIGITAL/475-Sites/AngelSolutions/Company/platform/convo/chatbot-ai-rag-langchain/apps/chatbot/web/portal/src/application/conversations/commands/SendMessageUseCase.ts)
  - [`src/application/conversations/commands/CreateConversationUseCase.ts`](file:///Users/angel.szymczak/Vaults/Harvis/300-MEMORIA_DIGITAL/475-Sites/AngelSolutions/Company/platform/convo/chatbot-ai-rag-langchain/apps/chatbot/web/portal/src/application/conversations/commands/CreateConversationUseCase.ts)
  - [`src/application/conversations/queries/GetConversationUseCase.ts`](file:///Users/angel.szymczak/Vaults/Harvis/300-MEMORIA_DIGITAL/475-Sites/AngelSolutions/Company/platform/convo/chatbot-ai-rag-langchain/apps/chatbot/web/portal/src/application/conversations/queries/GetConversationUseCase.ts)
* **Entidades e Invariantes de Dominio:**
  - [`src/domain/conversations/ConversationAggregate.ts`](file:///Users/angel.szymczak/Vaults/Harvis/300-MEMORIA_DIGITAL/475-Sites/AngelSolutions/Company/platform/convo/chatbot-ai-rag-langchain/apps/chatbot/web/portal/src/domain/conversations/ConversationAggregate.ts)
  - [`src/domain/conversations/IdempotencyKey.ts`](file:///Users/angel.szymczak/Vaults/Harvis/300-MEMORIA_DIGITAL/475-Sites/AngelSolutions/Company/platform/convo/chatbot-ai-rag-langchain/apps/chatbot/web/portal/src/domain/conversations/IdempotencyKey.ts)
  - [`src/domain/conversations/ConversationErrors.ts`](file:///Users/angel.szymczak/Vaults/Harvis/300-MEMORIA_DIGITAL/475-Sites/AngelSolutions/Company/platform/convo/chatbot-ai-rag-langchain/apps/chatbot/web/portal/src/domain/conversations/ConversationErrors.ts)
* **Puerto Secundario (SPI):**
  - [`src/domain/conversations/ConversationGateway.ts`](file:///Users/angel.szymczak/Vaults/Harvis/300-MEMORIA_DIGITAL/475-Sites/AngelSolutions/Company/platform/convo/chatbot-ai-rag-langchain/apps/chatbot/web/portal/src/domain/conversations/ConversationGateway.ts)
* **Adaptadores de Infraestructura:**
  - [`src/infrastructure/api/HttpConversationAdapter.ts`](file:///Users/angel.szymczak/Vaults/Harvis/300-MEMORIA_DIGITAL/475-Sites/AngelSolutions/Company/platform/convo/chatbot-ai-rag-langchain/apps/chatbot/web/portal/src/infrastructure/api/HttpConversationAdapter.ts)
  - [`src/infrastructure/api/MockConversationGateway.ts`](file:///Users/angel.szymczak/Vaults/Harvis/300-MEMORIA_DIGITAL/475-Sites/AngelSolutions/Company/platform/convo/chatbot-ai-rag-langchain/apps/chatbot/web/portal/src/infrastructure/api/MockConversationGateway.ts)
  - [`src/infrastructure/container.ts`](file:///Users/angel.szymczak/Vaults/Harvis/300-MEMORIA_DIGITAL/475-Sites/AngelSolutions/Company/platform/convo/chatbot-ai-rag-langchain/apps/chatbot/web/portal/src/infrastructure/container.ts)

---

## 3. Decisiones de Dominio Táctico y Aislamiento Multitenant

### 3.1. Invariantes y Value Objects

1. **`IdempotencyKey` (Value Object Inmutable):**
   - Encapsula la regla sintáctica RFC 4122 v4: `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`.
   - Prohíbe el uso de cadenas arbitrarias o marcas de tiempo vulnerables a colisiones.
   - Permite generación estocástica (`IdempotencyKey.generate()`) y validación estricta de formato (`IdempotencyKey.create(str)`).

2. **Invariante de Alternancia de Turnos (`canAppendUserMessage`):**
   - Una conversación no puede recibir un nuevo mensaje de rol `user` si el último mensaje registrado aún pertenece al rol `user` (turno pendiente).
   - El agregado de dominio evalúa:
     ```typescript
     canAppendUserMessage(): boolean {
       if (this.messages.length === 0) return true;
       return this.messages[this.messages.length - 1].role !== 'user';
     }
     ```
   - Si se vulnera, se arroja un `TurnInvariantError` de dominio puro que el adaptador mapea directamente al código `400 Bad Request`.

3. **`IdempotencyConflictError` (HTTP 409):**
   - Si se reenvía una clave que está actualmente siendo procesada por otro hilo en el clúster o con una discrepancia de contenido, se captura y traduce a nivel de aplicación sin corromper el estado de la UI.

### 3.2. Aislamiento por Tenant

- **Propagación Obligatoria de `X-Tenant-Id`:**
  El adaptador HTTP recupera el inquilino activo del `TenantContext` y garantiza su inyección en cada cabecera saliente:
  ```typescript
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Tenant-Id': activeTenantId,
    'X-Idempotency-Key': idempotencyKey,
  };
  ```
- **Aislamiento en Modo MOCK:**
  `MockConversationGateway` mantiene estructuras segregadas por tenant en memoria, impidiendo que los hilos de `corp-acme` sean accesibles por `default-tenant`.

---

## 4. Evidencia de Pruebas (Pirámide Completa)

El refactor se ejecutó bajo una rigurosa suite automatizada en **Vitest** y capturas en vivo con **Puppeteer**:

### 4.1. Pruebas Unitarias (Domain & Application)

* **Archivos:**
  - `src/domain/conversations/IdempotencyKey.test.ts`
  - `src/domain/conversations/ConversationId.test.ts`
  - `src/domain/conversations/ConversationAggregate.test.ts`
  - `src/application/conversations/commands/SendMessageUseCase.test.ts`
  - `src/application/conversations/commands/CreateConversationUseCase.test.ts`
  - `src/application/conversations/queries/GetConversationUseCase.test.ts`
* **Comando:** `npm test`
* **Resultado:**
  ```text
  ✓ src/domain/conversations/IdempotencyKey.test.ts (4)
  ✓ src/domain/conversations/ConversationId.test.ts (4)
  ✓ src/domain/conversations/ConversationAggregate.test.ts (4)
  ✓ src/application/conversations/commands/SendMessageUseCase.test.ts (3)
  ✓ src/application/conversations/commands/CreateConversationUseCase.test.ts (2)
  ✓ src/application/conversations/queries/GetConversationUseCase.test.ts (2)
  ```

### 4.2. Pruebas de Integración (Adapters & Presentation)

* **Archivos:**
  - `src/infrastructure/api/HttpConversationAdapter.test.ts`
  - `src/infrastructure/api/MockConversationGateway.test.ts`
  - `src/presentation/components/chat/ChatConsole.test.tsx`
  - `src/presentation/components/chat/ChatInput.test.tsx`
  - `src/presentation/components/chat/CreateConversationModal.test.tsx`
* **Comando:** `npm test`
* **Resultado:**
  ```text
  Test Files  97 passed (97)
       Tests  320 passed (320)
    Duration  22.49s
  ```

### 4.3. Pruebas de Aceptación Contractual (Outer Loop BDD)

```gherkin
Feature: Consola Conversacional con Idempotencia Resiliente (CU-03)

  Scenario: Reintento seguro ante falla de red sin duplicación de mensajes
    Given un usuario autenticado en el tenant "corp-acme"
    And una conversación activa con id "conv-cloud-1"
    When el usuario envía la consulta "Calcular presupuesto de infraestructura cloud"
    And la conexión de red se interrumpe antes de recibir la confirmación
    Then la interfaz muestra el banner de reintento con la misma clave de idempotencia
    When el usuario presiona "Reintentar (Misma Clave)"
    Then el backend retorna la respuesta cacheada sin re-ejecutar el modelo
    And no se generan mensajes duplicados en el historial

  Scenario: Prevención de doble envío mediante Turn Protection Guard
    Given una conversación con respuesta en vuelo del asistente
    When el usuario intenta enviar un segundo mensaje consecutivo
    Then el botón de envío y el input permanecen bloqueados
    And se visualiza el banner "Esperando respuesta del Asistente (Turno Protegido)"
```

### 4.4. Pruebas End-to-End & Capturas en Vivo (Puppeteer)

* **Script:** `scripts/capture-cu03.mjs`
* **Comando:** `PORTAL_URL=http://localhost:3005 node scripts/capture-cu03.mjs`
* **Resultado:** 4 evidencias visuales generadas en `docs/assets/`:
  - `docs/assets/cu03_chat_console_overview.png` (Consola y sugerencias empresariales)
  - `docs/assets/cu03_create_conversation_modal.png` (Modal 3D accesible)
  - `docs/assets/cu03_turn_protection_guard.png` (Bloqueo de turno en vuelo)
  - `docs/assets/cu03_conversation_completed.png` (Hilo completo con badges UUIDv4)

---

## 5. Lecciones Aprendidas y Concesiones (Trade-offs)

1. **Tolerant Reader en `HttpConversationAdapter` vs. Fuerte Acoplamiento a FastAPI:**
   - *Decisión:* La API de backend aún no dispone del endpoint `GET /conversations/{id}` y variaba los nombres de identificador (`id` vs `conversation_id`). Se implementó un lector tolerante con resolución en cascada y proxy fallback de mismo origen.
   - *Trade-off:* Requiere lógica de mapeo adicional en el cliente, pero garantiza que el portal nunca arroje errores de pantalla blanca ante variaciones del backend.
2. **Generación de Claves en el Cliente vs. Servidor:**
   - *Decisión:* El cliente es el emisor exclusivo del `X-Idempotency-Key` (UUIDv4) antes de tocar el socket de red.
   - *Trade-off:* Si el cliente se reinicia y borra su estado en memoria, la clave se pierde; sin embargo, para el ciclo de vida de la sesión interactiva, es la única manera de prevenir dobles submits ante latencia de red.
3. **Estilo Táctil Neubrutalista 3D:**
   - *Decisión:* Se sustituyeron sombras difusas y desenfoques (*glassmorphism*) por bordes negros rígidos de 2-4px y sombras sólidas desplazadas (`shadow-[4px_4px_0px_#000]`).
   - *Trade-off:* Menor estética corporativa convencional, pero máxima claridad visual sobre el estado del turno y una experiencia física gratificante al pulsar los controles.

---

## 6. Historial de Trazabilidad y Commits

### Historial de la Feature Branch (`feat/03-chat-idempotency`)

* `f7a1d9e`: `chore(dx): add portal Makefile, capture script live mode, and .agents framework`
* `f756b5a`: `docs(roadmap): add CU-03 chat idempotency execution plan`
* `865de1d`: `feat(conversations): implement CQRS commands, tolerant reader, and dynamic container for CU-03`
* `07f88d5`: `refactor(chat): purge coffee shop orphan domain and replace with Enterprise Cloud walkthrough domain`
* `95f4f9a`: `docs(roadmap): mark Fase 3 as completed in CU-03 execution plan`
* `d7286bb`: `feat(chat): implement Neubrutalism 3D CreateConversationModal, tactile mechanical buttons, and idempotency badges`
* `8183420`: `docs(roadmap): mark Fase 4 as completed in CU-03 execution plan`
* `1b2a62e`: `feat(chat): capture automated Puppeteer evidence and complete Fase 5 test suite for CU-03`
* `7b8164b`: `docs(rfcs): create RFC-33 backend chat idempotency contract and complete CU-03 roadmap`

### Commit Final en `development` (Squash Merge)

* `5c9eab1` — `feat(chat): overhaul CU-03 with 3D Neubrutalism, CQRS commands, resilient idempotency & RFC-33 (#17)`
