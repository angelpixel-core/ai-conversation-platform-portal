# 📐 CU-03: Consola Conversacional con Idempotencia Resiliente (Message Deduplication)
## Hoja de Ruta Frontend (`apps/chatbot/web/portal/docs/roadmap/03-cu-03-chat-idempotency.md`)

| Atributo | Detalle |
| :--- | :--- |
| **Identificador** | **CU-03** |
| **Paso del Backend Walkthrough** | **Step 3: Distributed Idempotency** ([`AI_CONVERSATION_PLATFORM_API.README.md`](file:///Users/angel.szymczak/Vaults/Harvis/300-MEMORIA_DIGITAL/475-Sites/AngelSolutions/Company/platform/convo/chatbot-ai-rag-langchain/apps/chatbot/web/portal/docs/AI_CONVERSATION_PLATFORM_API.README.md#L353)) |
| **Slices Backend Vinculados** | Slice 1 (Conversation Management), Slice 2 (Messaging & Outbox), Slice 5 (Distributed Idempotency) |
| **Endpoints Clave** | `POST /conversations`, `POST /conversations/{conversation_id}/messages` |
| **Cabeceras Críticas** | `Idempotency-Key: <UUIDv4>`, `X-Tenant-Id: <slug>` |
| **Estado de Implementación** | 🟡 Especificado (Listo para TDD) |

---

## 🎯 1. Objetivos de Negocio y Experiencia de Usuario (UX)

### 1.1 El Problema
En aplicaciones conversacionales, los usuarios frecuentemente presionan el botón de envío varias veces ante micro-retrasos de red, o sus dispositivos reintentan automáticamente tras pérdidas efímeras de conexión. Sin garantías de idempotencia distribuidas:
1. Se crean múltiples hilos o mensajes duplicados idénticos en la base de datos.
2. Se vulnera la invariante estricta del backend (`Cannot append user message before assistant responds`), provocando excepciones de dominio y fallos en cadena.
3. Se desperdicia presupuesto de inferencia de tokens en el modelo LLM.

### 1.2 La Solución Neubrutalism 3D
1. **`ChatInput` con Botón Táctil de Envío 3D:**
   - Campo de entrada con borde negro rígido de `2px`, sombra `4px 4px 0px #000`, y botón de acción principal en Azul Eléctrico (`#3B82F6`).
   - Micro-interacción háptica: En estado presionado (`:active`), el botón se desplaza `translate(2px, 2px)` con reducción de sombra a `2px 2px 0px #000`, brindando sensación táctil mecánica.
2. **Generación de `Idempotency-Key` en el Cliente:**
   - Antes de iniciar la petición HTTP, el cliente genera un identificador único criptográfico `UUIDv4` (`crypto.randomUUID()`).
   - Si el usuario presiona dos veces rápidamente el botón o la red reintenta automáticamente, la misma clave de idempotencia es transmitida en la cabecera `Idempotency-Key`.
3. **Actualización Optimista con Bloqueo de Turno:**
   - El mensaje se renderiza de inmediato en la línea de tiempo (`ChatTimeline`) con estado visual `Enviando...` (borde punteado y micro-loader neubrutalista).
   - El campo de entrada se deshabilita temporalmente hasta que el backend confirma la recepción o se inicializa el streaming del asistente, protegiendo la regla de alternancia de turnos.

---

## 🔌 2. Contrato de Integración API

### 2.1 Crear Conversación
- **Método:** `POST`
- **Ruta:** `/conversations`
- **Headers:**
  ```http
  Content-Type: application/json
  X-Tenant-Id: corp-acme
  Idempotency-Key: 7b8442c2-8419-42b7-84be-50d4d38562f1
  ```
- **Body:**
  ```json
  {
    "title": "Migración Cloud Enterprise"
  }
  ```
- **Respuesta 201 Created:**
  ```json
  {
    "id": "668064db-d2c9-4f6c-bc30-4435bb9e41fd",
    "title": "Migración Cloud Enterprise"
  }
  ```

### 2.2 Enviar Mensaje a Conversación
- **Método:** `POST`
- **Ruta:** `/conversations/{conversation_id}/messages`
- **Headers:**
  ```http
  Content-Type: application/json
  X-Tenant-Id: corp-acme
  Idempotency-Key: f059fa8f-6ef0-437f-9e9e-4d41a9ded399
  ```
- **Body:**
  ```json
  {
    "content": "Calcular presupuesto de infraestructura cloud."
  }
  ```
- **Respuesta 200 OK (Primera Ejecución o Replay Idempotente):**
  ```json
  {
    "conversation_id": "668064db-d2c9-4f6c-bc30-4435bb9e41fd",
    "role": "user",
    "content": "Calcular presupuesto de infraestructura cloud.",
    "created_at": "2026-10-05T20:45:00.000Z"
  }
  ```

### 2.3 Manejo de Conflictos y Violaciones de Invariante
- **HTTP 409 Conflict:** Si se reenvía el mismo `Idempotency-Key` pero con un contenido o payload diferente:
  ```json
  {
    "type": "https://errors.angelpixel.io/idempotency-conflict",
    "title": "Idempotency Conflict",
    "status": 409,
    "detail": "El Idempotency-Key ya fue utilizado previamente con una carga de datos diferente."
  }
  ```
- **HTTP 400 Bad Request (Violación de Turno):** Si se envía un segundo mensaje de usuario antes de que el worker procese y responda al primero:
  ```json
  {
    "error": "DomainInvariantViolation",
    "message": "Cannot append user message before assistant responds."
  }
  ```

---

## 🏛️ 3. Arquitectura Frontend (Clean Architecture)

```
src/
├── domain/conversations/
│   ├── ConversationId.ts             # Value Object UUIDv4
│   ├── IdempotencyKey.ts             # Value Object UUIDv4
│   ├── Message.ts                    # Entidad: id, role, content, createdAt, status
│   └── ConversationAggregate.ts      # Agregado: validación de turno e historial
├── application/conversations/
│   ├── useConversation.ts            # Hook para consulta de conversación activa
│   ├── useSendMessage.ts             # Hook de mutación con optimistic update e IdempotencyKey
│   └── useCreateConversation.ts      # Hook de creación de nueva conversación
├── infrastructure/api/
│   └── conversationsClient.ts        # Adaptador HTTP tipado (Axios con retry seguro)
└── presentation/components/chat/
    ├── ChatLayout.tsx                # Contenedor principal con estética Neubrutalism 3D
    ├── ChatTimeline.tsx              # Línea de tiempo de mensajes
    ├── MessageBubble.tsx             # Burbuja Neubrutalism con sombras sólidas
    └── ChatInput.tsx                 # Input con botón 3D táctil y protección anti-rebote
```

### 3.1 Value Object: `IdempotencyKey` (`domain/conversations/IdempotencyKey.ts`)
```typescript
export class IdempotencyKey {
  private static readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  private constructor(public readonly value: string) {
    if (!IdempotencyKey.UUID_REGEX.test(value)) {
      throw new Error(`IdempotencyKey inválida: '${value}'. Debe ser un UUIDv4.`);
    }
  }

  public static generate(): IdempotencyKey {
    return new IdempotencyKey(crypto.randomUUID());
  }

  public static from(value: string): IdempotencyKey {
    return new IdempotencyKey(value);
  }
}
```

### 3.2 Hook Orquestador con Actualización Optimista (`application/conversations/useSendMessage.ts`)
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IdempotencyKey } from '@/domain/conversations/IdempotencyKey';
import { conversationsClient } from '@/infrastructure/api/conversationsClient';

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      // Generación garantizada de clave única por intención de envío
      const key = IdempotencyKey.generate();
      return conversationsClient.sendMessage(conversationId, content, key.value);
    },
    onMutate: async (content: string) => {
      await queryClient.cancelQueries({ queryKey: ['conversation', conversationId] });
      const previous = queryClient.getQueryData(['conversation', conversationId]);

      // Optimistic Update instantáneo en la UI
      queryClient.setQueryData(['conversation', conversationId], (old: any) => ({
        ...old,
        isAwaitingAssistantResponse: true,
        messages: [
          ...(old?.messages || []),
          {
            id: 'temp-' + Date.now(),
            role: 'user',
            content,
            created_at: new Date().toISOString(),
            status: 'optimistic',
          },
        ],
      }));

      return { previous };
    },
    onError: (_err, _content, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['conversation', conversationId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
    },
  });
}
```

---

## 🧪 4. Especificación BDD en Gherkin (`.feature`)

Archivo: `tests/e2e/features/cu-03-chat-idempotency.feature`

```gherkin
Feature: CU-03 - Consola Conversacional e Idempotencia Resiliente
  Como usuario del portal corporativo
  Quiero enviar mensajes al chatbot con garantías de entrega exacta
  Para evitar duplicaciones de mensajes incluso si presiono varias veces el botón o falla la red

  Background:
    Given que el tenant "corp-acme" está activo
    And existe una conversación creada con ID "conv-cloud-1"
    And el usuario visualiza la pantalla del chat en "/dashboard/chat/conv-cloud-1"

  Scenario: Envío exitoso de mensaje con actualización optimista (Happy Path)
    When escribo "¿Cuál es la política de retención de datos?" en el campo de texto
    And hago clic en el botón "Enviar"
    Then el mensaje aparece de inmediato en la línea de tiempo con borde punteado de estado optimista
    And el botón de envío queda deshabilitado con estado visual presionado
    And la petición saliente incluye la cabecera "Idempotency-Key" con un UUIDv4 válido
    And cuando el backend responde 200 OK, el mensaje pasa a estado "confirmado"

  Scenario: Prevención de duplicados ante doble clic rápido (Deduplication)
    When escribo "Calcular costos estimados de almacenamiento"
    And presiono dos veces consecutivas el botón "Enviar" en menos de 200ms
    Then se genera una única clave de idempotencia
    And se despacha únicamente una petición HTTP al backend
    And la línea de tiempo muestra un único mensaje de usuario

  Scenario: Reintento transparente ante micro-corte de red sin generar duplicado
    Given que el usuario envió el mensaje "Exportar reporte de seguridad"
    When ocurre una desconexión momentánea antes de recibir el 200 OK
    And el cliente HTTP reintenta automáticamente con la MISMA "Idempotency-Key"
    Then el backend retorna el resultado cacheado idéntico
    And la conversación mantiene exactamente un único registro del mensaje
```

---

## 🛠️ 5. Mock Service Worker (MSW) Handlers & Fixtures

```typescript
// src/mocks/handlers/conversationHandlers.ts
import { http, HttpResponse, delay } from 'msw';

// Cache en memoria para simular el comportamiento de idempotencia del backend
const idempotencyStore = new Map<string, { status: number; body: any }>();

export const conversationHandlers = [
  // POST /conversations
  http.post('http://localhost:8000/conversations', async ({ request }) => {
    const body = (await request.json()) as any;
    const conversationId = 'conv-' + Math.random().toString(36).substring(2, 9);
    return HttpResponse.json(
      {
        id: conversationId,
        title: body.title || 'Nueva Conversación',
      },
      { status: 201 }
    );
  }),

  // POST /conversations/:id/messages con deduplicación por Idempotency-Key
  http.post('http://localhost:8000/conversations/:id/messages', async ({ params, request }) => {
    const idempotencyKey = request.headers.get('Idempotency-Key');
    const body = (await request.json()) as any;

    if (idempotencyKey && idempotencyStore.has(idempotencyKey)) {
      // Retornar exactamente el resultado previo almacenado (Replay)
      const cached = idempotencyStore.get(idempotencyKey)!;
      return HttpResponse.json(cached.body, { status: cached.status });
    }

    await delay(120);

    const messageResponse = {
      conversation_id: params.id,
      role: 'user',
      content: body.content,
      created_at: new Date().toISOString(),
    };

    if (idempotencyKey) {
      idempotencyStore.set(idempotencyKey, { status: 200, body: messageResponse });
    }

    return HttpResponse.json(messageResponse, { status: 200 });
  }),
];
```

---

## 🔬 6. Estrategia TDD (Vitest & React Testing Library)

1. **`IdempotencyKey.test.ts` (Unit Test):**
   - Verifica la generación automática de UUIDv4 conformes a la especificación RFC 4122.
   - Rechaza valores vacíos o que no coincidan con la estructura canónica.
2. **`useSendMessage.test.ts` (Hook Test con MSW):**
   - Valida la inyección de la cabecera `Idempotency-Key`.
   - Simula dos ejecuciones de mutación con la misma clave y verifica que la UI maneje el replay idéntico.
   - Comprueba la reversión optimista en caso de error 500.
3. **`ChatInput.test.tsx` (Component Test):**
   - Comprueba estilos Neubrutalism (`border-2 border-black`, `shadow-[4px_4px_0px_#000]`).
   - Verifica que el botón y el input queden en estado `disabled` inmediatamente tras el primer envío para mitigar clics dobles mecánicos en el frontend.
   - Simula tecla `Enter` y valida que no dispare envíos cuando el botón está deshabilitado.

---

## 🚀 7. Propuestas de Mejora para el Backend (Feedback / RFC)

Durante el análisis del comportamiento de idempotencia del backend y la integración con el cliente web, se proponen los siguientes RFCs:

### RFC-07: Cabecera de Telemetría `Idempotency-Replayed: true`
- **Situación Actual:** Cuando el backend detecta una clave repetida, retorna el resultado cacheado con código `200 OK`, pero no incluye ningún indicador en los headers que permita al cliente saber si la respuesta provino de una ejecución en vivo o del caché de deduplicación.
- **Propuesta:** Incluir en la respuesta HTTP:
  ```http
  Idempotency-Replayed: true
  ```
  o seguir el estándar [IETF Draft: The Idempotency-Key HTTP Header Field](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/):
  ```http
  Idempotency-Key-Status: replayed
  ```
- **Beneficio Frontend:** Permite al cliente mostrar un micro-badge de advertencia o confirmación ("Respuesta recuperada por reintento") en logs de depuración.

### RFC-08: Documentación Explícita del TTL de Claves de Idempotencia
- **Situación Actual:** El backend almacena las claves en base de datos (`idempotency_records`), pero no explicita en OpenAPI el tiempo de expiración (TTL) tras el cual una clave caduca.
- **Propuesta:** Exponer en el OpenAPI y/o en un header `Idempotency-Key-Expires: 86400` la vigencia de la clave para que clientes móviles o web desconectados durante horas sepan cuándo regenerar la clave.

### RFC-09: Endpoint de Listado Paginado de Conversaciones (`GET /conversations`)
- **Situación Actual:** La API expone `POST /conversations` para crear una conversación, pero no incluye un endpoint público `GET /conversations?limit=20` filtrado por `X-Tenant-Id` para permitir a la barra lateral del portal listar el historial de conversaciones previas del usuario/organización.
- **Propuesta:** Implementar:
  ```http
  GET /conversations?limit=20&offset=0
  Header: X-Tenant-Id: corp-acme
  ```
  Retornando la lista ordenada por `updated_at DESC`.

---

## ✅ 8. Criterios de Aceptación (Definition of Done - DoD)

- [ ] Value Object `IdempotencyKey` implementado con validación criptográfica y cobertura unitaria.
- [ ] Hook `useSendMessage` configurado con mutación optimista y generación de UUIDv4.
- [ ] Cliente HTTP configurado para incluir `Idempotency-Key` en `POST /conversations` y `POST /conversations/{id}/messages`.
- [ ] Componente `ChatInput` maquetado con diseño Neubrutalism 3D, micro-animación táctil `:active` y protección anti-rebote.
- [ ] Manejo visual en UI de los estados optimistas (`pending`, `confirmed`, `error`).
- [ ] MSW handlers implementando simulación de caché por `Idempotency-Key` y conflicto `HTTP 409`.
- [ ] Escenarios Gherkin de CU-03 listos para integración en Playwright-BDD.
