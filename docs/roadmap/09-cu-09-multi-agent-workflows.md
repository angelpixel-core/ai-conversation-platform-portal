# 📐 CU-09: Grafo Visual de Workflows Multi-Agente y Checkpoints (State Graphs & Resumption)
## Hoja de Ruta Frontend (`apps/chatbot/web/portal/docs/roadmap/09-cu-09-multi-agent-workflows.md`)

| Atributo | Detalle |
| :--- | :--- |
| **Identificador** | **CU-09** |
| **Paso del Backend Walkthrough** | **Step 9: Multi-Agent Orchestration, State Graphs & Checkpoint Resumption** ([`AI_CONVERSATION_PLATFORM_API.README.md`](file:///Users/angel.szymczak/Vaults/Harvis/300-MEMORIA_DIGITAL/475-Sites/AngelSolutions/Company/platform/convo/chatbot-ai-rag-langchain/apps/chatbot/web/portal/docs/AI_CONVERSATION_PLATFORM_API.README.md#L602)) |
| **Slice Backend Vinculado** | Slice 9 (Multi-Agent Orchestration, Hierarchical Supervisor & State Graphs) |
| **Endpoints Clave** | `POST /tenants/{tenant_id}/workflows`, `GET .../stream`, `GET .../checkpoints`, `POST .../resume` |
| **Estado de Implementación** | 🟡 Especificado (Listo para TDD) |

---

## 🎯 1. Objetivos de Negocio y Experiencia de Usuario (UX)

### 1.1 El Problema
Las tareas complejas de razonamiento e investigación requieren la coordinación de múltiples agentes especializados (ej. **Supervisor**, **Investigador / Researcher**, **Auditor** y **Sintetizador**) orquestados mediante grafos de estado cíclicos o dirigidos (LangGraph / State Graphs).

Monitorear estos procesos como texto continuo es confuso para los administradores:
1. No se visualiza qué agente tiene el control de la tarea en cada momento ni cuándo ocurre un traspaso (*agent handoff*).
2. Si un flujo se detiene por requerir aprobación o ante una excepción, el operador necesita examinar la foto exacta del estado (**Checkpoint**) y reanudarlo (*resumption*) desde ese nodo específico sin reiniciar el grafo completo.

### 1.2 La Solución Neubrutalism 3D
1. **`WorkflowGraphViewer` (Lienzo Interactivo de Nodos 3D):**
   - Panel visual con nodos rectangulares representativos de cada agente con borde negro rígido de `3px`, sombra dura `5px 5px 0px #000`, y líneas de conexión ortogonales de alto contraste.
   - Código cromático de agentes:
     - 🟣 **Supervisor:** Violeta / Púrpura profundo (`#8B5CF6`).
     - 🔵 **Investigador (Researcher):** Azul eléctrico (`#3B82F6`).
     - 🟡 **Auditor / HITL Guard:** Cyber Yellow (`#FBBF24`).
     - 🟢 **Sintetizador:** Verde esmeralda (`#10B981`).
   - Iluminación del nodo activo con contorno pulsante de alto contraste e indicador de estado (`RUNNING`, `PAUSED_FOR_APPROVAL`, `COMPLETED`).
2. **`CheckpointsTimeline` (Línea de Tiempo de Puntos de Control Inmutables):**
   - Barra lateral vertical que registra cada versión de checkpoint persistida en MSSQL (Versión 1, Versión 2, etc.).
   - Al seleccionar cualquier versión previa, la interfaz permite viajar en el tiempo (*Time-Travel Inspection*) e inspeccionar el snapshot JSON exacto de variables y memoria.
3. **`WorkflowResumeControls` (Barra de Reanudación Manual):**
   - Permite al operador inyectar parámetros de override o aprobación (`supervisor_override: "Approved by human operator"`) y presionar el botón 3D "Reanudar Flujo" (`POST .../resume`).

---

## 🔌 2. Contrato de Integración API

### 2.1 Iniciar Ejecución de Workflow Multi-Agente
- **Método:** `POST`
- **Ruta:** `/tenants/{tenant_id}/workflows`
- **Headers:**
  ```http
  Content-Type: application/json
  X-Tenant-Id: corp-acme
  ```
- **Payload:**
  ```json
  {
    "graph_name": "research_and_audit_pipeline",
    "initial_context": {
      "query": "Auditar directivas de seguridad corporativas y resumir factores de riesgo."
    }
  }
  ```
- **Respuesta 202 Accepted:**
  ```json
  {
    "workflow_id": "wf-alpha-1",
    "status": "RUNNING",
    "graph_name": "research_and_audit_pipeline"
  }
  ```

### 2.2 Streaming en Vivo de Handoffs y Checkpoints (SSE)
- **Método:** `GET`
- **Ruta:** `/tenants/{tenant_id}/workflows/{workflow_id}/stream`
- **Eventos Emitidos:**
  ```http
  event: agent_handoff
  data: {"from_agent": "supervisor", "to_agent": "researcher", "task": "Recolectar evidencias de auditoría"}

  event: subagent_completed
  data: {"agent": "researcher", "output": {"findings_count": 4}}

  event: checkpoint_saved
  data: {"checkpoint_id": "chk-v1", "node": "researcher", "version": 1, "status": "RUNNING"}
  ```

### 2.3 Listar Historial de Checkpoints Persistidos
- **Método:** `GET`
- **Ruta:** `/tenants/{tenant_id}/workflows/{workflow_id}/checkpoints`
- **Respuesta 200 OK:**
  ```json
  [
    {
      "checkpoint_id": "chk-v1",
      "version": 1,
      "node": "supervisor",
      "state_snapshot": { "query": "Auditar...", "step": "initialized" },
      "created_at": "2026-10-05T22:50:00Z"
    },
    {
      "checkpoint_id": "chk-v2",
      "version": 2,
      "node": "researcher",
      "state_snapshot": { "query": "Auditar...", "findings": ["Aviso 1", "Aviso 2"] },
      "created_at": "2026-10-05T22:50:15Z"
    }
  ]
  ```

### 2.4 Reanudar Flujo desde Checkpoint Pausado
- **Método:** `POST`
- **Ruta:** `/tenants/{tenant_id}/workflows/{workflow_id}/resume`
- **Payload:**
  ```json
  {
    "node_id": "auditor",
    "updated_context": {
      "supervisor_override": "Aprobado manualmente por oficial de seguridad"
    }
  }
  ```
- **Respuesta 200 OK:** Retorna el workflow actualizado en estado `RUNNING`.

---

## 🏛️ 3. Arquitectura Frontend (Clean Architecture)

```
src/
├── domain/workflows/
│   ├── WorkflowId.ts             # Value Object UUID / Slug
│   ├── NodeStatus.ts             # Type: 'IDLE' | 'RUNNING' | 'WAITING_APPROVAL' | 'COMPLETED' | 'FAILED'
│   ├── WorkflowCheckpoint.ts     # Entidad: id, version, node, stateSnapshot, createdAt
│   └── WorkflowAggregate.ts      # Agregado: id, graphName, activeNode, checkpoints, status
├── application/workflows/
│   ├── useWorkflowExecution.ts   # Hook para iniciar y orquestar el flujo
│   ├── useWorkflowStream.ts      # Suscripción SSE a eventos de handoff y progreso
│   ├── useWorkflowCheckpoints.ts # Consulta TanStack Query para checkpoints
│   └── useResumeWorkflow.ts      # Mutación de reanudación con contexto actualizado
├── infrastructure/api/
│   └── workflowsClient.ts        # Adaptador HTTP para /workflows
└── presentation/components/workflows/
    ├── WorkflowGraphViewer.tsx   # Visor interactivo de nodos en Canvas/SVG 3D
    ├── AgentNodeCard.tsx         # Nodo de agente con borde 3px y micro-iluminación
    ├── CheckpointsTimeline.tsx   # Línea de tiempo vertical de versiones
    ├── SnapshotInspectorModal.tsx# Modal para inspeccionar variables en JSON
    └── WorkflowResumeControls.tsx# Barra de control para inyectar override y reanudar
```

### 3.1 Entidad: `WorkflowCheckpoint` (`domain/workflows/WorkflowCheckpoint.ts`)
```typescript
export class WorkflowCheckpoint {
  constructor(
    public readonly id: string,
    public readonly version: number,
    public readonly node: string,
    public readonly stateSnapshot: Record<string, unknown>,
    public readonly createdAt: Date
  ) {}

  get formattedSnapshot(): string {
    return JSON.stringify(this.stateSnapshot, null, 2);
  }
}
```

### 3.2 Componente Neubrutalism 3D: `AgentNodeCard.tsx`
```typescript
import React from 'react';
import { NodeStatus } from '@/domain/workflows/NodeStatus';

interface Props {
  agentName: string;
  role: string;
  status: NodeStatus;
  accentColor: string; // ej: '#8B5CF6'
}

export const AgentNodeCard: React.FC<Props> = ({ agentName, role, status, accentColor }) => {
  const isRunning = status === 'RUNNING';

  return (
    <div
      style={{ borderLeftColor: accentColor }}
      className={`relative w-48 p-3 bg-white dark:bg-slate-900 border-2 border-black dark:border-white shadow-[4px_4px_0px_#000] border-l-8 transition-all ${
        isRunning ? 'ring-4 ring-yellow-400 animate-pulse' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-black uppercase tracking-wider">{role}</span>
        <span
          className={`w-2.5 h-2.5 rounded-full border border-black ${
            isRunning ? 'bg-yellow-400' : status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-slate-300'
          }`}
        />
      </div>
      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{agentName}</p>
      <div className="mt-2 text-[10px] font-mono text-slate-600 dark:text-slate-400">
        Estado: <span className="font-bold">{status}</span>
      </div>
    </div>
  );
};
```

---

## 🧪 4. Especificación BDD en Gherkin (`.feature`)

Archivo: `tests/e2e/features/cu-09-multi-agent-workflows.feature`

```gherkin
Feature: CU-09 - Workflows Multi-Agente y Puntos de Control (Checkpoints)
  Como administrador de proyectos de IA corporativos
  Quiero supervisar el flujo de colaboración entre múltiples agentes
  Y examinar las fotos de estado de cada versión para reanudar flujos pausados

  Background:
    Given que el tenant "corp-acme" está activo
    And el usuario accede a la consola de workflows en "/dashboard/workflows"

  Scenario: Ejecución de flujo y visualización de handoff de agentes en vivo (Happy Path)
    When inicio el workflow "research_and_audit_pipeline"
    Then el backend retorna status "RUNNING" y el nodo "supervisor" se ilumina en el grafo
    When se recibe el evento SSE "agent_handoff" hacia "researcher"
    Then el nodo "researcher" transiciona a estado activo con contorno amarillo neón
    And la línea de tiempo registra el checkpoint versión 1

  Scenario: Inspección de checkpoints pasados (Time-Travel Debugging)
    Given que el workflow alcanzó el checkpoint versión 2
    When selecciono el checkpoint "Versión 1" en la línea de tiempo
    Then se despliega el modal "SnapshotInspectorModal"
    And puedo auditar el estado exacto de variables en ese instante previo

  Scenario: Reanudación de flujo pausado con override del operador
    Given que el nodo "auditor" se encuentra pausado en espera de autorización
    When el operador ingresa "supervisor_override: Aprobado manualmente"
    And hace clic en el botón 3D "Reanudar Flujo"
    Then se despacha una llamada POST a "/workflows/{id}/resume"
    And el flujo continúa hacia el nodo "synthesizer" completando la ejecución
```

---

## 🛠️ 5. Mock Service Worker (MSW) Handlers & Fixtures

```typescript
// src/mocks/handlers/workflowHandlers.ts
import { http, HttpResponse, delay } from 'msw';

let checkpointsList = [
  {
    checkpoint_id: 'chk-v1',
    version: 1,
    node: 'supervisor',
    state_snapshot: { query: 'Auditar seguridad', stage: 'initial' },
    created_at: new Date(Date.now() - 30000).toISOString(),
  },
  {
    checkpoint_id: 'chk-v2',
    version: 2,
    node: 'researcher',
    state_snapshot: { query: 'Auditar seguridad', findings: ['Riesgo 1', 'Riesgo 2'] },
    created_at: new Date().toISOString(),
  },
];

export const workflowHandlers = [
  // Iniciar workflow
  http.post('http://localhost:8000/tenants/:tenant_id/workflows', async () => {
    await delay(100);
    return HttpResponse.json(
      { workflow_id: 'wf-alpha-1', status: 'RUNNING', graph_name: 'research_and_audit_pipeline' },
      { status: 202 }
    );
  }),

  // Listar checkpoints
  http.get('http://localhost:8000/tenants/:tenant_id/workflows/:id/checkpoints', async () => {
    await delay(60);
    return HttpResponse.json(checkpointsList);
  }),

  // Reanudar workflow
  http.post('http://localhost:8000/tenants/:tenant_id/workflows/:id/resume', async ({ request }) => {
    const body = (await request.json()) as any;
    await delay(100);
    checkpointsList.push({
      checkpoint_id: 'chk-v3',
      version: 3,
      node: body.node_id || 'auditor',
      state_snapshot: { ...checkpointsList[1].state_snapshot, ...body.updated_context },
      created_at: new Date().toISOString(),
    });
    return HttpResponse.json({ status: 'RUNNING', resumed_node: body.node_id });
  }),
];
```

---

## 🔬 6. Estrategia TDD (Vitest & React Testing Library)

1. **`WorkflowCheckpoint.test.ts` (Unit Test):**
   - Valida el formateo seguro a JSON de estados con estructuras anidadas.
2. **`useWorkflowCheckpoints.test.ts` (Hook Test con MSW):**
   - Valida la carga de snapshots y el orden cronológico estricto por `version ASC`.
3. **`AgentNodeCard.test.tsx` (Component Test):**
   - Comprueba estilos Neubrutalism (`border-2 border-black`, `shadow-[4px_4px_0px_#000]`).
   - Verifica la clase de animación pulsante cuando `status === 'RUNNING'`.
4. **`SnapshotInspectorModal.test.tsx` (Component Test):**
   - Valida que renderice el bloque de código JSON con botones de copiado táctil.

---

## 🚀 7. Propuestas de Mejora para el Backend (Feedback / RFC)

Durante el diseño de la interfaz de grafos de workflows, se proponen los siguientes RFCs de mejora para el backend:

### RFC-25: Endpoint de Definición Topológica del Grafo (`GET /workflows/graphs/{graph_name}`)
- **Situación Actual:** El cliente conoce el nombre del grafo (`research_and_audit_pipeline`), pero no existe un endpoint que devuelva la definición estática de sus nodos, conexiones, etiquetas y tipos de aristas (dirigidas o condicionales). Esto obliga al frontend a hardcodear la topología en componentes estáticos.
- **Propuesta:** Exponer:
  ```http
  GET /tenants/{tenant_id}/workflows/graphs/{graph_name}/schema
  ```
  Devolviendo la lista de nodos, aristas dirigidas y roles asignados (compatible con formato React Flow o Mermaid).
- **Beneficio Frontend:** Permite al `WorkflowGraphViewer` renderizar cualquier grafo multi-agente dinámicamente sin cambios de código en la UI.

### RFC-26: Endpoint para Cancelar Flujo (`POST .../workflows/{id}/cancel`)
- **Situación Actual:** No hay un endpoint documentado para abortar un workflow que haya entrado en un ciclo infinito o que el operador decida interrumpir.
- **Propuesta:** Implementar `POST /tenants/{tenant_id}/workflows/{workflow_id}/cancel` con código de gracia para limpiar recursos y liberar el worker.

### RFC-27: Cálculo de Diffs Incrementales de Checkpoints
- **Situación Actual:** Cada checkpoint devuelve el snapshot completo del estado. En flujos con grandes volúmenes de documentos, el payload JSON puede superar varios megabytes por versión.
- **Propuesta:** Soportar un parámetro `GET .../checkpoints?format=diff` que retorne únicamente los campos modificados entre la versión N y la versión N-1.

---

## ✅ 8. Criterios de Aceptación (Definition of Done - DoD)

- [ ] Entidades de dominio `WorkflowCheckpoint` y agregado `WorkflowAggregate` creadas en `domain/workflows/`.
- [ ] Hooks `useWorkflowExecution`, `useWorkflowCheckpoints` y `useResumeWorkflow` implementados con TanStack Query.
- [ ] Componente `WorkflowGraphViewer` maquetado con diseño Neubrutalism 3D y resaltado dinámico de nodos.
- [ ] Línea de tiempo vertical `CheckpointsTimeline` interactiva con visor de snapshots en JSON.
- [ ] Handlers MSW configurados para simular ejecución, checkpoints y reanudación con override.
- [ ] Escenarios Gherkin de CU-09 validados o listos para Playwright-BDD.
