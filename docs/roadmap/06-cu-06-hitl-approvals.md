# 📐 CU-06: Centro de Aprobaciones Human-in-the-Loop (HITL Tool Execution)
## Hoja de Ruta Frontend (`apps/chatbot/web/portal/docs/roadmap/06-cu-06-hitl-approvals.md`)

| Atributo | Detalle |
| :--- | :--- |
| **Identificador** | **CU-06** |
| **Paso del Backend Walkthrough** | **Step 8: Secure Tool Calling & Human-in-the-Loop Approval** ([`AI_CONVERSATION_PLATFORM_API.README.md`](file:///Users/angel.szymczak/Vaults/Harvis/300-MEMORIA_DIGITAL/475-Sites/AngelSolutions/Company/platform/convo/chatbot-ai-rag-langchain/apps/chatbot/web/portal/docs/AI_CONVERSATION_PLATFORM_API.README.md#L564)) |
| **Slice Backend Vinculado** | Slice 8 (Secure Tool Calling, Sandboxed Execution & HITL) |
| **Endpoints Clave** | `POST /tenants/{tenant_id}/approvals`, `GET /tenants/{tenant_id}/approvals/pending`, `POST /tenants/{tenant_id}/approvals/{approval_id}/decision` |
| **Estado de Implementación** | 🟡 Especificado (Listo para TDD) |

---

## 🎯 1. Objetivos de Negocio y Experiencia de Usuario (UX)

### 1.1 El Problema
Cuando los agentes de IA invocan herramientas de alto privilegio (ej. `refund_payment`, `execute_sql_query`, `export_customer_data`), la ejecución autónoma no supervisada introduce riesgos críticos de seguridad y cumplimiento financiero. 

El sistema requiere un mecanismo de **Human-in-the-Loop (HITL)** donde el agente suspenda la ejecución y un operador humano autorizado deba inspeccionar los argumentos exactos, verificar la justificación y autorizar o denegar la acción de forma auditable.

### 1.2 La Solución Neubrutalism 3D
1. **`ApprovalsInboxCard` (Bandeja de Aprobaciones Táctil):**
   - Panel accesible en `/dashboard/approvals` o modal flotante rápido.
   - Borde negro sólido de `3px`, sombra dura de `5px 5px 0px #000`, y badge contador neubrutalista con fondo Cyber Yellow (`#FBBF24`) indicando solicitudes pendientes.
   - Lista de tarjetas de solicitudes con tipografía de alto contraste, identificador del agente solicitante (`agent-financial-advisor`), herramienta requerida y timestamp relativo.
2. **`ToolArgumentsInspectorModal` (Inspector de Argumentos JSON):**
   - Al hacer clic en "Inspeccionar Solicitud", se abre un modal elevado 3D con visor de código JSON formateado y resaltado de sintaxis sobre fondo oscuro (`#0F172A`).
   - Campo obligatorio de justificación del operador (`Justificación de auditoría`).
3. **Botones de Decisión Mecánicos 3D:**
   - 🟢 **`Aprobar Ejecución`:** Fondo verde esmeralda (`#10B981`), texto blanco/negro en negrita, micro-interacción `:active:translate(2px, 2px)` con reducción de sombra.
   - 🔴 **`Rechazar Ejecución`:** Fondo rojo alerta (`#EF4444`), borde negro `2px`, requiriendo confirmación obligatoria para prevenir rechazos accidentales.

---

## 🔌 2. Contrato de Integración API

### 2.1 Listar Solicitudes de Aprobación Pendientes
- **Método:** `GET`
- **Ruta:** `/tenants/{tenant_id}/approvals/pending`
- **Headers:**
  ```http
  Accept: application/json
  X-Tenant-Id: corp-acme
  ```
- **Respuesta 200 OK:**
  ```json
  [
    {
      "approval_id": "appr-7925e0bc-2358-4560-bf64-53c8db4da2d9",
      "tool_name": "refund_payment",
      "arguments": {
        "amount": 500,
        "currency": "USD",
        "customer_id": "cust-8812"
      },
      "requested_by": "agent-financial-advisor",
      "reason": "Customer cancellation refund",
      "status": "PENDING",
      "created_at": "2026-10-05T21:40:00Z"
    }
  ]
  ```

### 2.2 Resolver Aprobación (Aprobar o Rechazar)
- **Método:** `POST`
- **Ruta:** `/tenants/{tenant_id}/approvals/{approval_id}/decision`
- **Headers:**
  ```http
  Content-Type: application/json
  X-Tenant-Id: corp-acme
  ```
- **Payload:**
  ```json
  {
    "decision": "approve",
    "resolved_by": "sec-officer@corp.com",
    "reason": "Verified operational credentials and customer identity"
  }
  ```
- **Respuesta 200 OK:**
  ```json
  {
    "approval_id": "appr-7925e0bc-2358-4560-bf64-53c8db4da2d9",
    "status": "APPROVED",
    "resolved_by": "sec-officer@corp.com",
    "resolved_at": "2026-10-05T21:42:15Z"
  }
  ```

### 2.3 Evento SSE de Solicitud de Aprobación
Al escuchar el stream de la conversación (`GET /conversations/{id}/stream`):
```http
event: tool_approval_required
data: {"approval_id": "appr-7925e0bc", "tool_name": "refund_payment", "call_id": "call-1", "arguments": {"amount": 500, "currency": "USD"}}
```

---

## 🏛️ 3. Arquitectura Frontend (Clean Architecture)

```
src/
├── domain/tools/
│   ├── ApprovalId.ts               # Value Object UUID / Slug
│   ├── ApprovalDecision.ts         # Type: 'approve' | 'reject'
│   ├── ApprovalStatus.ts           # Type: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
│   └── ToolApprovalRequest.ts      # Entidad con argumentos, agente, razón y estado
├── application/tools/
│   ├── usePendingApprovals.ts      # Hook TanStack Query para listar solicitudes
│   └── useResolveApproval.ts       # Hook de mutación para autorizar/denegar
├── infrastructure/api/
│   └── approvalsClient.ts          # Adaptador HTTP para endpoints de /approvals
└── presentation/components/approvals/
    ├── ApprovalsInbox.tsx          # Bandeja general con badge contador
    ├── ApprovalRequestCard.tsx     # Tarjeta individual con botones de acción 3D
    └── ToolArgumentsInspectorModal.tsx # Modal de inspección JSON y justificación
```

### 3.1 Entidad: `ToolApprovalRequest` (`domain/tools/ToolApprovalRequest.ts`)
```typescript
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
export type ApprovalDecision = 'approve' | 'reject';

export class ToolApprovalRequest {
  constructor(
    public readonly id: string,
    public readonly toolName: string,
    public readonly argumentsPayload: Record<string, unknown>,
    public readonly requestedBy: string,
    public readonly requestReason: string,
    public readonly status: ApprovalStatus,
    public readonly createdAt: Date,
    public readonly resolvedBy?: string,
    public readonly decisionReason?: string
  ) {}

  get isPending(): boolean {
    return this.status === 'PENDING';
  }

  get formattedArguments(): string {
    return JSON.stringify(this.argumentsPayload, null, 2);
  }
}
```

### 3.2 Hook de Mutación con Feedback Táctil (`application/tools/useResolveApproval.ts`)
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { approvalsClient } from '@/infrastructure/api/approvalsClient';
import { ApprovalDecision } from '@/domain/tools/ToolApprovalRequest';

interface ResolveParams {
  tenantId: string;
  approvalId: string;
  decision: ApprovalDecision;
  reason: string;
  resolvedBy: string;
}

export function useResolveApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tenantId, approvalId, decision, reason, resolvedBy }: ResolveParams) => {
      if (!reason.trim()) {
        throw new Error('La justificación de auditoría es obligatoria.');
      }
      return approvalsClient.resolveDecision(tenantId, approvalId, { decision, reason, resolvedBy });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['approvals', variables.tenantId] });
    },
  });
}
```

---

## 🧪 4. Especificación BDD en Gherkin (`.feature`)

Archivo: `tests/e2e/features/cu-06-hitl-approvals.feature`

```gherkin
Feature: CU-06 - Aprobación Humana de Herramientas Críticas (HITL)
  Como operador de seguridad corporativo
  Quiero auditar las llamadas a herramientas sensibles solicitadas por los agentes de IA
  Para autorizar o denegar su ejecución garantizando trazabilidad y control

  Background:
    Given que el tenant "corp-acme" está activo
    And existe una solicitud pendiente para la herramienta "refund_payment" con monto "500 USD"
    And el operador accede a la bandeja "/dashboard/approvals"

  Scenario: Operador inspecciona y aprueba una llamada a herramienta sensible (Happy Path)
    When visualizo la bandeja de solicitudes pendientes
    Then observo una tarjeta con badge "PENDING" y herramienta "refund_payment"
    When hago clic en "Inspeccionar Argumentos"
    Then se despliega el modal "ToolArgumentsInspectorModal" con el JSON formateado
    When ingreso la justificación "Aprobado tras verificar orden de compra"
    And hago clic en el botón táctil "Aprobar Ejecución"
    Then se envía la decisión "approve" al backend
    And la solicitud transiciona a estado "APPROVED" con estilo verde Neubrutalism
    And desaparece de la bandeja de pendientes

  Scenario: Operador rechaza una llamada a herramienta con justificación obligatoria
    When abro la solicitud de ejecución para "execute_sql_query"
    When ingreso la justificación "Consulta no autorizada fuera del horario de mantenimiento"
    And hago clic en el botón táctil "Rechazar Ejecución"
    Then se envía la decisión "reject"
    And la solicitud queda registrada como "REJECTED" en la auditoría

  Scenario: Validación de justificación obligatoria antes de enviar decisión
    When abro el modal de inspección
    And dejo el campo de justificación vacío
    And intento presionar "Aprobar Ejecución"
    Then el botón permanece inhabilitado o se muestra una alerta visual "Justificación requerida"
```

---

## 🛠️ 5. Mock Service Worker (MSW) Handlers & Fixtures

```typescript
// src/mocks/handlers/approvalHandlers.ts
import { http, HttpResponse, delay } from 'msw';

let pendingApprovals = [
  {
    approval_id: 'appr-7925e0bc-2358-4560-bf64-53c8db4da2d9',
    tool_name: 'refund_payment',
    arguments: { amount: 500, currency: 'USD', customer_id: 'cust-8812' },
    requested_by: 'agent-financial-advisor',
    reason: 'Customer cancellation refund',
    status: 'PENDING',
    created_at: new Date().toISOString(),
  },
];

export const approvalHandlers = [
  // Listar pendientes
  http.get('http://localhost:8000/tenants/:tenant_id/approvals/pending', async () => {
    await delay(70);
    return HttpResponse.json(pendingApprovals);
  }),

  // Resolver aprobación
  http.post(
    'http://localhost:8000/tenants/:tenant_id/approvals/:approval_id/decision',
    async ({ params, request }) => {
      const body = (await request.json()) as any;
      await delay(100);

      pendingApprovals = pendingApprovals.filter(
        (appr) => appr.approval_id !== params.approval_id
      );

      return HttpResponse.json({
        approval_id: params.approval_id,
        status: body.decision === 'approve' ? 'APPROVED' : 'REJECTED',
        resolved_by: body.resolved_by,
        resolved_at: new Date().toISOString(),
      });
    }
  ),
];
```

---

## 🔬 6. Estrategia TDD (Vitest & React Testing Library)

1. **`ToolApprovalRequest.test.ts` (Unit Test):**
   - Valida el formateo adecuado del payload de argumentos JSON.
   - Verifica el flag booleano `isPending`.
2. **`useResolveApproval.test.ts` (Hook Test con MSW):**
   - Valida el lanzamiento de excepción si la justificación está vacía.
   - Simula una aprobación exitosa y comprueba la invalidación de la query en caché.
3. **`ApprovalRequestCard.test.tsx` (Component Test):**
   - Comprueba la estética Neubrutalism 3D (`border-2 border-black`, `shadow-[4px_4px_0px_#000]`).
   - Verifica que los botones "Aprobar" y "Rechazar" tengan los estilos funcionales verde/rojo.
4. **`ToolArgumentsInspectorModal.test.tsx` (Component Test):**
   - Comprueba que el bloque de código JSON esté dentro de un contenedor `<pre><code>` accesible.
   - Verifica que no permita hacer submit si el textarea de justificación no tiene texto.

---

## 🚀 7. Propuestas de Mejora para el Backend (Feedback / RFC)

Durante el análisis del flujo de aprobación humana de herramientas, se proponen los siguientes RFCs de mejora para el backend:

### RFC-16: Canal de Notificaciones Push de Aprobaciones (`GET /tenants/{tenant_id}/approvals/stream`)
- **Situación Actual:** Para enterarse de una nueva aprobación, el operador debe hacer polling a `GET /pending` o estar escuchando el stream de la conversación individual que originó la llamada. Si el operador está en otra vista del portal, no recibe avisos.
- **Propuesta:** Crear un canal SSE o WebSocket a nivel de organización:
  ```http
  GET /tenants/{tenant_id}/approvals/stream
  ```
  Que emita eventos en vivo:
  ```http
  event: approval_requested
  data: {"approval_id": "appr-123", "tool_name": "refund_payment", "urgency": "HIGH"}
  ```
- **Beneficio Frontend:** Permite desplegar un badge de notificación y sonido táctil de alerta en el header independientemente de la página en la que se encuentre el usuario.

### RFC-17: Tiempo de Expiración Automática de Aprobaciones (Timeout / TTL)
- **Situación Actual:** Si ningún operador resuelve la solicitud, la aprobación permanece en `PENDING` indefinidamente y el agente queda bloqueado esperando.
- **Propuesta:** Añadir un campo `expires_at` y un cron/worker de backend que transicione a `EXPIRED` tras N minutos (configurable por política), reanudando al agente con una excepción `ToolExecutionTimeoutError` para que tome una ruta de respuesta alternativa.

### RFC-18: Validación Estricta de Justificación No Vacía en Backend (HTTP 422)
- **Propuesta:** Forzar en el esquema de Pydantic de FastAPI que `reason` tenga `min_length=10`. Si el operador envía un texto vacío o trivial, devolver `HTTP 422 Unprocessable Entity` con mensaje explicativo, garantizando la validez de la auditoría corporativa.

---

## ✅ 8. Criterios de Aceptación (Definition of Done - DoD)

- [ ] Entidad `ToolApprovalRequest` y tipos de decisión implementados en `domain/tools/`.
- [ ] Hook `usePendingApprovals` y `useResolveApproval` configurados en `application/tools/`.
- [ ] Adaptador `approvalsClient.ts` conectado a los endpoints `/pending` y `/{id}/decision`.
- [ ] Componente `ApprovalsInboxCard` y listado implementados con diseño Neubrutalism 3D.
- [ ] Modal `ToolArgumentsInspectorModal` con visor JSON y validación de justificación obligatoria.
- [ ] Handlers MSW configurados para simular aprobación y rechazo de herramientas.
- [ ] Escenarios Gherkin de CU-06 listos para ejecución en Playwright-BDD.
