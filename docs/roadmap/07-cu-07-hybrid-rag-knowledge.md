# 📐 CU-07: Gestor de Base de Conocimiento y RAG Híbrido (Knowledge Grounding & Citations)
## Hoja de Ruta Frontend (`apps/chatbot/web/portal/docs/roadmap/07-cu-07-hybrid-rag-knowledge.md`)

| Atributo | Detalle |
| :--- | :--- |
| **Identificador** | **CU-07** |
| **Paso del Backend Walkthrough** | **Step 7: Knowledge Ingestion, Semantic Vector Search & Hybrid RAG** ([`AI_CONVERSATION_PLATFORM_API.README.md`](file:///Users/angel.szymczak/Vaults/Harvis/300-MEMORIA_DIGITAL/475-Sites/AngelSolutions/Company/platform/convo/chatbot-ai-rag-langchain/apps/chatbot/web/portal/docs/AI_CONVERSATION_PLATFORM_API.README.md#L535)) |
| **Slice Backend Vinculado** | Slice 7 (Semantic Vector Search, Hybrid RAG & Knowledge Grounding) |
| **Endpoints Clave** | `POST /tenants/{tenant_id}/documents`, `GET /tenants/{tenant_id}/documents/{document_id}/status`, Evento SSE `event: citation` |
| **Códigos HTTP Clave** | `HTTP 202 Accepted` (Ingesta Asíncrona en Cola), `HTTP 200 OK` |
| **Estado de Implementación** | 🟡 Especificado (Listo para TDD) |

---

## 🎯 1. Objetivos de Negocio y Experiencia de Usuario (UX)

### 1.1 El Problema
Los modelos de lenguaje tienden a generar respuestas inexactas o alucinaciones si no cuentan con información contextual verificada de la empresa. Además, los usuarios desconfían de las respuestas de una IA si no pueden contrastar la fuente documental exacta de donde provino cada afirmación.

Por otro lado, la subida y procesamiento de documentos (chunking, generación de embeddings de alta dimensión e indexación en base de datos relacional/vectorial) es una operación computacionalmente costosa que se procesa de forma asíncrona mediante workers en RabbitMQ.

### 1.2 La Solución Neubrutalism 3D
1. **`DocumentDropzone` (Zona de Carga Retro-Futurista):**
   - Panel de arrastre con borde discontinuo rígido de `3px border-dashed border-black dark:border-white`, fondo papel cálido (`#FAF9F6`), y sombra proyectada `4px 4px 0px #000`.
   - Estado `:dragover` con transición visual a fondo Cyber Yellow (`#FEF3C7`) y micro-animación mecánica de carpeta física de archivos.
2. **`DocumentStatusTable` (Monitoreo de Indexación Asíncrona):**
   - Tabla neubrutalista con contornos negros y badges de estado:
     - 🟡 **`PROCESSING`:** Amarillo con icono de engranaje (consumiéndose por el worker de indexación).
     - 🟢 **`INDEXED`:** Verde esmeralda (`#10B981`) con número de chunks generados y score de densidad léxica.
     - 🔴 **`FAILED`:** Rojo alerta con tooltip de error.
3. **`CitationCard` y `CitationDrawer` (Tarjetas de Citas en el Chat):**
   - En las respuestas del asistente, se inyectan chips interactivos táctiles `[Fuente: manual_seguridad.pdf #chunk-2]`.
   - Al hacer clic, se abre un cajón lateral (*Side Drawer*) con elevación 3D que muestra el fragmento textual original (*snippet*), el score de similitud coseno (ej. `94% de coincidencia`) y la página o sección de procedencia.

---

## 🔌 2. Contrato de Integración API

### 2.1 Carga de Documento para Ingesta
- **Método:** `POST`
- **Ruta:** `/tenants/{tenant_id}/documents`
- **Headers:**
  ```http
  Content-Type: application/json
  X-Tenant-Id: corp-acme
  ```
- **Payload:**
  ```json
  {
    "filename": "politica_seguridad_2026.pdf",
    "content_type": "application/pdf",
    "content": "Antigravity enforces strict multi-tenant data isolation and L2-normalized vector similarity search."
  }
  ```
- **Respuesta 202 Accepted (Ingesta Despachada a Cola):**
  ```json
  {
    "document_id": "doc-5128a3f1-4b10-4c8d-81e0-a7bb5001d100",
    "status": "INGESTED",
    "chunks_count": 0
  }
  ```

### 2.2 Consultar Estado de Indexación y Chunks
- **Método:** `GET`
- **Ruta:** `/tenants/{tenant_id}/documents/{document_id}/status`
- **Headers:** `X-Tenant-Id: corp-acme`
- **Respuesta 200 OK (Completado):**
  ```json
  {
    "document_id": "doc-5128a3f1-4b10-4c8d-81e0-a7bb5001d100",
    "status": "INDEXED",
    "chunks_count": 6,
    "indexed_at": "2026-10-05T22:30:10Z"
  }
  ```

### 2.3 Eventos SSE de Citas en Tiempo Real
Durante la transmisión de la respuesta en `GET /conversations/{id}/stream`:
```http
event: citation
data: {"source_document_id": "doc-5128a3f1", "document_name": "politica_seguridad_2026.pdf", "chunk_id": "chunk-3", "similarity_score": 0.92, "snippet": "Antigravity enforces strict multi-tenant data isolation and vector search."}
```

---

## 🏛️ 3. Arquitectura Frontend (Clean Architecture)

```
src/
├── domain/knowledge/
│   ├── DocumentId.ts              # Value Object UUID
│   ├── Citation.ts                # Value Object: sourceDocId, docName, chunkId, score, snippet
│   └── KnowledgeDocument.ts       # Entidad: id, filename, status ('INGESTED' | 'INDEXED' | 'FAILED')
├── application/knowledge/
│   ├── useDocumentUpload.ts       # Mutación con gestión de carga y respuesta 202
│   ├── useDocumentStatus.ts       # Polling optimista con TanStack Query hasta status: 'INDEXED'
│   └── useCitationsManager.ts     # Buffer de citas asociadas a cada mensaje del chat
├── infrastructure/api/
│   └── knowledgeClient.ts         # Adaptador HTTP para endpoints de /documents
└── presentation/components/knowledge/
    ├── DocumentDropzone.tsx       # Dropzone Neubrutalism 3D con drag & drop
    ├── DocumentStatusTable.tsx    # Tabla de archivos indexados con badges
    ├── CitationChip.tsx           # Micro-botón táctil adosado a la respuesta de chat
    └── CitationDrawer.tsx         # Panel lateral 3D con visor de fragmento original
```

### 3.1 Value Object: `Citation` (`domain/knowledge/Citation.ts`)
```typescript
export class Citation {
  constructor(
    public readonly sourceDocumentId: string,
    public readonly documentName: string,
    public readonly chunkId: string,
    public readonly similarityScore: number,
    public readonly snippet: string
  ) {}

  get formattedScore(): string {
    return `${Math.round(this.similarityScore * 100)}% relevancia`;
  }

  get truncatedSnippet(): string {
    return this.snippet.length > 140
      ? this.snippet.substring(0, 140) + '...'
      : this.snippet;
  }
}
```

### 3.2 Hook de Polling Optimista (`application/knowledge/useDocumentStatus.ts`)
```typescript
import { useQuery } from '@tanstack/react-query';
import { knowledgeClient } from '@/infrastructure/api/knowledgeClient';

export function useDocumentStatus(tenantId: string, documentId?: string) {
  return useQuery({
    queryKey: ['documentStatus', tenantId, documentId],
    queryFn: () => knowledgeClient.getStatus(tenantId, documentId!),
    enabled: Boolean(documentId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Detener el polling automáticamente cuando termine o falle
      if (status === 'INDEXED' || status === 'FAILED') return false;
      return 2000; // Consultar cada 2 segundos mientras esté procesando
    },
  });
}
```

---

## 🧪 4. Especificación BDD en Gherkin (`.feature`)

Archivo: `tests/e2e/features/cu-07-hybrid-rag-knowledge.feature`

```gherkin
Feature: CU-07 - Ingesta de Documentos y Búsqueda Híbrida RAG
  Como usuario de la base de conocimiento corporativa
  Quiero subir documentos y ver citas explícitas en las respuestas del asistente
  Para comprobar la fidelidad y fuente de las afirmaciones generadas

  Background:
    Given que el tenant "corp-acme" está activo
    And el usuario accede a la sección "/dashboard/knowledge"

  Scenario: Carga de documento y transición asíncrona de indexación (Happy Path)
    When arrastro el archivo "normativa_seguridad.pdf" sobre "DocumentDropzone"
    Then se muestra el indicador con borde sólido y estado "Subiendo..."
    When el backend responde 202 Accepted
    Then la tabla refleja el documento con badge amarillo "INGESTED (Encolado)"
    When el worker de indexación completa los embeddings vectoriales
    Then el badge se actualiza automáticamente a verde "INDEXED (6 chunks)"

  Scenario: Detección y despliegue de tarjeta de cita en el chat conversacional
    Given que el documento "normativa_seguridad.pdf" está completamente indexado
    When pregunto "¿Cuáles son las directivas de cifrado corporativas?"
    Then la respuesta del asistente incluye el chip táctil "Cita [normativa_seguridad.pdf]"
    When hago clic en el chip de cita
    Then se abre el panel lateral "CitationDrawer" con elevación 3D
    And visualizo el fragmento citado con texto exacto y score de similitud "92% relevancia"
```

---

## 🛠️ 5. Mock Service Worker (MSW) Handlers & Fixtures

```typescript
// src/mocks/handlers/knowledgeHandlers.ts
import { http, HttpResponse, delay } from 'msw';

const documentsStore = new Map<string, any>();

export const knowledgeHandlers = [
  // Subida de documento -> 202 Accepted
  http.post('http://localhost:8000/tenants/:tenant_id/documents', async ({ request }) => {
    const body = (await request.json()) as any;
    await delay(120);

    const docId = 'doc-' + Math.random().toString(36).substring(2, 9);
    const newDoc = {
      document_id: docId,
      filename: body.filename,
      status: 'INGESTED',
      chunks_count: 0,
      created_at: new Date().toISOString(),
    };

    documentsStore.set(docId, newDoc);

    // Simular indexación tras 3 segundos
    setTimeout(() => {
      if (documentsStore.has(docId)) {
        documentsStore.set(docId, {
          ...documentsStore.get(docId),
          status: 'INDEXED',
          chunks_count: 4,
          indexed_at: new Date().toISOString(),
        });
      }
    }, 3000);

    return HttpResponse.json(newDoc, { status: 202 });
  }),

  // Consulta de estado de indexación
  http.get('http://localhost:8000/tenants/:tenant_id/documents/:document_id/status', async ({ params }) => {
    await delay(60);
    const doc = documentsStore.get(params.document_id as string);
    if (!doc) {
      return HttpResponse.json({ error: 'DocumentNotFound' }, { status: 404 });
    }
    return HttpResponse.json(doc, { status: 200 });
  }),
];
```

---

## 🔬 6. Estrategia TDD (Vitest & React Testing Library)

1. **`Citation.test.ts` (Unit Test):**
   - Valida el cálculo de porcentaje legible de `similarityScore`.
   - Verifica el truncado del snippet a un máximo de 140 caracteres.
2. **`useDocumentStatus.test.ts` (Hook Test con MSW):**
   - Valida el polling cada 2s mientras el estado sea `INGESTED`.
   - Verifica la detención automática del polling al recibir `status: 'INDEXED'`.
3. **`DocumentDropzone.test.tsx` (Component Test):**
   - Comprueba estilos Neubrutalism (`border-3 border-dashed border-black`, `shadow-[4px_4px_0px_#000]`).
   - Simula evento `drop` con archivo PDF y valida que se invoque la mutación de subida.
4. **`CitationDrawer.test.tsx` (Component Test):**
   - Valida la apertura del panel lateral al hacer clic en el chip.
   - Verifica que contenga el nombre del documento y el texto del fragmento citado.

---

## 🚀 7. Propuestas de Mejora para el Backend (Feedback / RFC)

Durante el diseño de la integración del módulo de RAG, se formulan los siguientes RFCs de mejora para el backend:

### RFC-19: Soporte Estándar `multipart/form-data` para Archivos Binarios
- **Situación Actual:** El endpoint `POST /documents` espera un payload JSON con el contenido del archivo serializado en texto (`"content": "..."`). Esto resulta ineficiente y problemático para PDFs escaneados o binarios pesados.
- **Propuesta:** Soportar `multipart/form-data` estándar en FastAPI:
  ```http
  POST /tenants/{tenant_id}/documents
  Content-Type: multipart/form-data
  ```
  Permitiendo subir directamente el archivo binario (`File(...)`) para que el backend o el worker apliquen parsers nativos de PDF/DOCX (ej. `pypdf`, `pdfplumber`).

### RFC-20: Endpoint de Listado de Documentos del Tenant (`GET /tenants/{tenant_id}/documents`)
- **Situación Actual:** Existe endpoint de upload y consulta por `document_id`, pero no hay un endpoint para listar todos los documentos indexados de la empresa.
- **Propuesta:** Exponer:
  ```http
  GET /tenants/{tenant_id}/documents?limit=50&offset=0
  ```
  Permitiendo a la interfaz mostrar el catálogo completo de documentos de la base de conocimiento.

### RFC-21: Endpoint de Eliminación de Documento (`DELETE /tenants/{tenant_id}/documents/{document_id}`)
- **Propuesta:** Permitir purgar documentos obsoletos del vector store y base de datos relacional para evitar respuestas desactualizadas cuando cambien normativas corporativas.

---

## ✅ 8. Criterios de Aceptación (Definition of Done - DoD)

- [ ] Value Object `Citation` y entidad `KnowledgeDocument` implementados en `domain/knowledge/`.
- [ ] Hook `useDocumentUpload` gestionando el código `HTTP 202 Accepted` de FastAPI.
- [ ] Hook `useDocumentStatus` con polling resiliente y parada automática al completar indexación.
- [ ] Componente `DocumentDropzone` con diseño Neubrutalism 3D y soporte drag & drop.
- [ ] Componente `CitationChip` y panel lateral `CitationDrawer` implementados en la vista de chat.
- [ ] Handlers MSW configurados para simular subida y cambio de estado a `INDEXED`.
- [ ] Escenarios Gherkin de CU-07 validados o listos para Playwright-BDD.
