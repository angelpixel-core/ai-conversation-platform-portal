# 📐 CU-08: Streaming en Tiempo Real Resiliente vía SSE (Token Streaming & Stream Recovery)
## Hoja de Ruta Frontend (`apps/chatbot/web/portal/docs/roadmap/08-cu-08-resilient-sse-streaming.md`)

| Atributo | Detalle |
| :--- | :--- |
| **Identificador** | **CU-08** |
| **Paso del Backend Walkthrough** | **Step 4: Real-Time SSE Streaming & Resilient Recovery** ([`AI_CONVERSATION_PLATFORM_API.README.md`](file:///Users/angel.szymczak/Vaults/Harvis/300-MEMORIA_DIGITAL/475-Sites/AngelSolutions/Company/platform/convo/chatbot-ai-rag-langchain/apps/chatbot/web/portal/docs/AI_CONVERSATION_PLATFORM_API.README.md#L407)) |
| **Slices Backend Vinculados** | Slice 2 (SSE Real-Time Streaming) & Slice 5 (Resilient Stream Recovery) |
| **Endpoint Clave** | `GET /conversations/{conversation_id}/stream` |
| **Cabeceras Críticas** | `X-Tenant-Id: <slug>`, `Last-Event-ID: <sequence_number>`, `Accept: text/event-stream` |
| **Estado de Implementación** | 🟡 Especificado (Listo para TDD) |

---

## 🎯 1. Objetivos de Negocio y Experiencia de Usuario (UX)

### 1.1 El Problema
Esperar a que un modelo LLM concluya la generación completa de una respuesta de 500 palabras genera una latencia percibida inaceptable (de 5 a 15 segundos con pantalla congelada). Los usuarios exigen ver los tokens progresivamente en pantalla conforme se generan (*Time-to-First-Token* óptimo).

Sin embargo, las conexiones HTTP de streaming de larga duración en la web son vulnerables a micro-cortes de red, switches entre Wi-Fi y datos móviles o suspensión de pestañas en segundo plano. Si la conexión se interrumpe:
1. Una implementación tradicional pierde la respuesta a la mitad y debe reiniciar la inferencia desde cero, duplicando costos y tokens.
2. Si se reintenta ciegamente, se duplican párrafos o se pierde la coherencia del diálogo.

### 1.2 La Solución Neubrutalism 3D
1. **`StreamingChatBubble` (Burbuja con Cursor Terminal Retro):**
   - Tarjeta contenedora del asistente con borde negro sólido de `2px`, sombra plana de `4px 4px 0px #000` y tipografía nítida sobre fondo blanco papel.
   - **Cursor de Tipeo Mecánico:** Un bloque cursor neubrutalista (`▋`) con micro-animación parpadeante continua (`blink 0.8s infinite`) adosado al último carácter renderizado.
2. **Buffer de Renderizado Anti-Parpadeo:**
   - Acumulación reactiva en memoria que evita re-renderizados pesados del árbol de React, procesando fragmentos de texto en lotes suaves de `16ms` (sincronizados con `requestAnimationFrame`).
3. **Reconexión Resiliente con `Last-Event-ID`:**
   - El cliente lleva el registro del último número de secuencia recibido en cada chunk (`id: N`).
   - Ante cualquier desconexión imprevista, el cliente reconecta automáticamente inyectando `Last-Event-ID: N`.
   - El backend consulta el buffer persistido en MSSQL y continúa la transmisión exactamente a partir de `N + 1` sin re-invocar al LLM.

---

## 🔌 2. Contrato de Integración API

### 2.1 Conexión Inicial de Streaming
- **Método:** `GET`
- **Ruta:** `/conversations/{conversation_id}/stream?temperature=0.7&max_tokens=1000`
- **Headers:**
  ```http
  Accept: text/event-stream
  X-Tenant-Id: corp-acme
  ```

#### Formato del Flujo de Eventos SSE:
```http
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

id: 1
data: La 

id: 2
data: política 

id: 3
data: de 

id: 4
data: seguridad 

id: 5
data: establece 

data: [DONE]
```

### 2.2 Reanudación tras Caída de Conexión (Stream Recovery)
- **Método:** `GET`
- **Ruta:** `/conversations/{conversation_id}/stream`
- **Headers:**
  ```http
  Accept: text/event-stream
  X-Tenant-Id: corp-acme
  Last-Event-ID: 4
  ```

#### Respuesta Reanudada del Backend:
```http
id: 5
data: establece 

id: 6
data: el 

id: 7
data: uso 

id: 8
data: obligatorio 

data: [DONE]
```

---

## 🏛️ 3. Arquitectura Frontend (Clean Architecture)

```
src/
├── domain/streaming/
│   ├── StreamChunk.ts              # Value Object: sequenceId, tokenText, isDone
│   └── StreamSession.ts            # Entidad: conversationId, lastEventId, text, status
├── application/streaming/
│   ├── useConversationStream.ts    # Hook orquestador del ciclo de vida SSE
│   └── streamBufferReducer.ts      # Reducer inmutable para ensamblado de tokens
├── infrastructure/sse/
│   └── resilientEventSource.ts     # Cliente SSE basado en fetch y ReadableStream
└── presentation/components/chat/
    ├── StreamingChatBubble.tsx     # Burbuja con cursor parpadeante retro
    ├── TypingBlinkCursor.tsx       # Cursor mecánico neubrutalista
    └── StreamRecoveryBanner.tsx    # Notificación sutil de "Reconectando flujo..."
```

### 3.1 Cliente SSE Resiliente (`infrastructure/sse/resilientEventSource.ts`)
Debido a que el `EventSource` nativo del navegador no admite cabeceras HTTP personalizadas (`X-Tenant-Id`, `Last-Event-ID`), se implementa un adaptador con la API estándar `fetch` y `ReadableStream`:

```typescript
export interface StreamHandlers {
  onToken: (chunk: { id?: number; text: string }) => void;
  onDone: () => void;
  onError: (error: Error) => void;
  onReconnect: (attempt: number) => void;
}

export async function openResilientStream(
  url: string,
  tenantId: string,
  lastEventId: number | null,
  handlers: StreamHandlers,
  signal: AbortSignal
) {
  const headers: Record<string, string> = {
    Accept: 'text/event-stream',
    'X-Tenant-Id': tenantId,
  };

  if (lastEventId !== null && lastEventId > 0) {
    headers['Last-Event-ID'] = String(lastEventId);
  }

  try {
    const response = await fetch(url, { headers, signal });
    if (!response.ok) {
      throw new Error(`SSE Falló con status ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No ReadableStream body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      let currentId: number | undefined;

      for (const line of lines) {
        if (line.startsWith('id:')) {
          currentId = parseInt(line.replace('id:', '').trim(), 10);
        } else if (line.startsWith('data:')) {
          const data = line.replace('data:', '').trimStart();
          if (data.trim() === '[DONE]') {
            handlers.onDone();
            return;
          }
          handlers.onToken({ id: currentId, text: data });
        }
      }
    }
  } catch (err: any) {
    if (signal.aborted) return;
    handlers.onError(err);
  }
}
```

### 3.2 Hook Orquestador (`application/streaming/useConversationStream.ts`)
```typescript
import { useState, useEffect, useRef } from 'react';
import { openResilientStream } from '@/infrastructure/sse/resilientEventSource';

export function useConversationStream(conversationId: string, tenantId: string) {
  const [accumulatedText, setAccumulatedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const lastEventIdRef = useRef<number | null>(null);

  const startStream = () => {
    const controller = new AbortController();
    setIsStreaming(true);

    const connect = (idToResume: number | null) => {
      openResilientStream(
        `http://localhost:8000/conversations/${conversationId}/stream`,
        tenantId,
        idToResume,
        {
          onToken: ({ id, text }) => {
            if (id !== undefined) lastEventIdRef.current = id;
            setAccumulatedText((prev) => prev + text);
          },
          onDone: () => {
            setIsStreaming(false);
            setIsReconnecting(false);
          },
          onError: () => {
            setIsReconnecting(true);
            // Reintento con backoff y envío de Last-Event-ID
            setTimeout(() => connect(lastEventIdRef.current), 1500);
          },
          onReconnect: () => setIsReconnecting(true),
        },
        controller.signal
      );
    };

    connect(null);
    return () => controller.abort();
  };

  return { accumulatedText, isStreaming, isReconnecting, startStream };
}
```

---

## 🧪 4. Especificación BDD en Gherkin (`.feature`)

Archivo: `tests/e2e/features/cu-08-resilient-sse-streaming.feature`

```gherkin
Feature: CU-08 - Streaming de Tokens en Tiempo Real Resiliente (SSE)
  Como usuario del chat
  Quiero ver la respuesta del asistente en tiempo real a medida que se genera
  Y que se reanude fluidamente si hay un corte de red sin duplicar texto ni reiniciar la IA

  Background:
    Given que el tenant "corp-acme" está activo
    And existe una conversación activa con id "conv-stream-1"

  Scenario: Recepción fluida de tokens en tiempo real (Happy Path)
    When el asistente comienza a generar la respuesta
    Then visualizo el componente "StreamingChatBubble" con borde negro de 2px y sombra sólida
    And se visualiza el cursor de tipeo parpadeante "▋"
    And los tokens "La ", "política ", "de " aparecen progresivamente en pantalla sin parpadeo
    When el backend emite el evento "[DONE]"
    Then el cursor de tipeo se oculta
    And el estado transiciona a "COMPLETED"

  Scenario: Recuperación transparente ante desconexión de red (Stream Recovery)
    Given que el cliente ha recibido tokens hasta la secuencia con id "4" ("La política de seguridad ")
    When se produce una interrupción repentina de la conexión de red
    Then el portal muestra sutilmente el badge "Reconectando flujo..."
    When el cliente reconecta al endpoint con la cabecera "Last-Event-ID: 4"
    Then el backend reanuda el stream a partir de la secuencia 5 ("establece ")
    And el texto se completa fluidamente sin reiniciar la respuesta desde el principio
    And no se duplican palabras en la burbuja de chat
```

---

## 🛠️ 5. Mock Service Worker (MSW) Handlers & Fixtures

```typescript
// src/mocks/handlers/streamingHandlers.ts
import { http, HttpResponse, delay } from 'msw';

const mockTokens = [
  { id: 1, text: 'La ' },
  { id: 2, text: 'política ' },
  { id: 3, text: 'de ' },
  { id: 4, text: 'seguridad ' },
  { id: 5, text: 'establece ' },
  { id: 6, text: 'el ' },
  { id: 7, text: 'uso ' },
  { id: 8, text: 'obligatorio. ' },
];

export const streamingHandlers = [
  http.get('http://localhost:8000/conversations/:id/stream', ({ request }) => {
    const lastEventId = request.headers.get('Last-Event-ID');
    const startIdx = lastEventId ? parseInt(lastEventId, 10) : 0;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        for (let i = startIdx; i < mockTokens.length; i++) {
          await delay(60); // Simular latencia de generación de token
          const chunk = mockTokens[i];
          controller.enqueue(encoder.encode(`id: ${chunk.id}\ndata: ${chunk.text}\n\n`));
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new HttpResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }),
];
```

---

## 🔬 6. Estrategia TDD (Vitest & React Testing Library)

1. **`resilientEventSource.test.ts` (Unit Test):**
   - Valida el parseo correcto de líneas `id:` y `data:`.
   - Verifica la inclusión obligatoria de `X-Tenant-Id` y `Last-Event-ID` en los headers de `fetch`.
   - Comprueba que el evento `[DONE]` dispare `onDone()` y detenga el bucle.
2. **`useConversationStream.test.ts` (Hook Test con MSW):**
   - Comprueba la acumulación progresiva de texto sin pérdida de caracteres.
   - Simula un corte de red intencional y verifica que el segundo request incluya `Last-Event-ID` igual al último id procesado.
3. **`StreamingChatBubble.test.tsx` (Component Test):**
   - Comprueba las clases Neubrutalism (`border-2 border-black`, `shadow-[4px_4px_0px_#000]`).
   - Verifica la presencia del cursor de tipeo mientras `isStreaming === true`.
   - Valida que al concluir el stream, el cursor se desmonte limpiamente.

---

## 🚀 7. Propuestas de Mejora para el Backend (Feedback / RFC)

Durante el diseño de la recuperación de streaming, se formulan los siguientes RFCs de mejora para el backend:

### RFC-22: Comentarios SSE de Latencia / Heartbeat (`: ping`)
- **Situación Actual:** Si el modelo LLM tarda 3 a 5 segundos en emitir el primer token (*cold start* o razonamiento profundo), la conexión permanece en silencio total. Proxies corporativos o balanceadores pueden cerrar la conexión por *idle timeout*.
- **Propuesta:** Emitir comentarios periódicos cada 5 segundos mientras se prepara la inferencia:
  ```http
  : keep-alive
  ```
- **Beneficio Frontend:** Mantiene viva la conexión TCP sin saturar el parser de eventos del cliente.

### RFC-23: Estandarización de Chunks de Texto en Formato JSON
- **Situación Actual:** Los tokens de texto se emiten como texto plano (`data: token\n\n`), mientras que citas (`event: citation`) y otros metadatos se emiten como JSON serializado.
- **Propuesta:** Estandarizar todos los eventos como JSON estructurado:
  ```http
  id: 1
  event: token
  data: {"seq": 1, "text": "Hola", "tokens_count": 1}
  ```
- **Beneficio Frontend:** Permite una deserialización fuertemente tipada y extensible para adjuntar metadatos como latencia por token o logprobs si fuera necesario.

### RFC-24: Documentación de la Política de Retención del Stream Buffer en MSSQL
- **Situación Actual:** El backend guarda los fragmentos en la tabla `stream_buffers`, pero no explicita durante cuántos minutos u horas persisten.
- **Propuesta:** Documentar el tiempo de vida (TTL) del buffer (ej. 1 hora tras completado) para que el frontend sepa cuándo puede intentar reconectar con `Last-Event-ID` y cuándo debe advertir al usuario que la sesión expiró.

---

## ✅ 8. Criterios de Aceptación (Definition of Done - DoD)

- [ ] Adaptador `resilientEventSource.ts` implementado con `fetch` y `ReadableStream` soportando cabeceras personalizadas.
- [ ] Hook `useConversationStream` con soporte completo de reconexión y `Last-Event-ID`.
- [ ] Componente `StreamingChatBubble` maquetado con estética Neubrutalism 3D y cursor parpadeante retro.
- [ ] Renderizado suave en 60 FPS sin bloqueos en el hilo principal del navegador.
- [ ] Handlers MSW configurados para simular streaming en vivo y reconexión con offset de id.
- [ ] Escenarios Gherkin de CU-08 validados o listos para Playwright-BDD.
