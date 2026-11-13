# 🛡️ Reglas y Estándares de Arquitectura, Auditoría y Calidad de Casos de Uso

> **Ubicación:** `.agents/rules/use-case-audit-standards.md`  
> **Ámbito:** Frontend Web Portal (`apps/chatbot/web/portal`)  
> **Propósito:** Esta regla es de cumplimiento obligatorio para cualquier intervención, auditoría, refactorización o desarrollo sobre los Casos de Uso (`CU-01` a `CU-10`) en el portal web.

---

## 1. Principios de Arquitectura Limpia y Desacoplamiento

1. **Inversión de Dependencias y Pureza del Dominio (`src/domain/`):**
   - El código en `domain/` debe ser TypeScript puro.
   - **Prohibido terminantemente** importar React, Next.js, hooks, Axios, Fetch, Tailwind o dependencias de UI en la capa de dominio.
   - Las entidades deben encapsular la lógica de negocio y las validaciones de invariantes.
   - Todo puerto de infraestructura debe definirse como interfaz (`I...Repository`, `I...Client`).

2. **Segregación CQRS en Capa de Aplicación (`src/application/`):**
   - Separar estrictamente operaciones de lectura (**Queries**) de operaciones de mutación (**Commands**).
   - Los comandos que modifiquen estado o envíen mensajes deben generar y propagar un `Idempotency-Key` (UUIDv4) para garantizar idempotencia cliente-servidor.

3. **Adaptadores Resilientes y Tolerant Reader (`src/infrastructure/`):**
   - Toda comunicación HTTP/SSE debe implementar el patrón **Tolerant Reader**:
     - Mapeo defensivo de respuestas de backend hacia modelos de dominio.
     - Manejo de propiedades faltantes, nombres alternativos (`id` vs `tenant_id`) y compatibilidad hacia atrás.
     - Transformación de errores HTTP en excepciones de dominio semánticas (`TenantNotFoundError`, `QuotaExceededError`, `IdempotencyConflictError`).

4. **Multi-Tenant Isolation Estricto:**
   - Ninguna petición saliente puede omitir la cabecera `X-Tenant-ID` ni el contexto de la empresa activa.
   - Queda prohibido hardcodear identificadores de tenant en URLs o servicios productivos.

---

## 2. Estándares Visuales: Sistema de Diseño Neubrutalism 3D

Cualquier componente visual desarrollado o refactorizado debe respetar las directrices de **Neubrutalism 3D**:

| Atributo | Especificación Técnica | Clase / Estilo Tailwind |
| :--- | :--- | :--- |
| **Contornos (Borders)** | Sólidos, rígidos de 2px a 3px | `border-2 border-black dark:border-white` |
| **Sombras (Box-Shadow)** | Planas, nítidas, sin desenfoque (`blur=0`) | `shadow-[4px_4px_0px_0px_#000000]` |
| **Tarjetas Elevadas** | Mayor profundidad para modales o paneles | `shadow-[6px_6px_0px_0px_#000000]` |
| **Micro-interacción Hover** | Desplazamiento sutil hacia arriba e izquierda | `hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000]` |
| **Micro-interacción Active** | Compresión física mecánica (sensación táctil) | `active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_0px_#000]` |
| **Transiciones** | Rápidas y reactivas | `transition-all duration-150` |
| **Accesibilidad Foco** | Anillos de foco evidentes | `focus:ring-2 focus:ring-black focus:outline-none` |

> [!WARNING]
> **Prohibido:** No utilizar sombras difuminadas estándar (`shadow-md`, `shadow-lg`, `shadow-xl` de Tailwind con blur gaussiano), ni bordes redondeados excesivos (`rounded-full` o `rounded-3xl` en contenedores de datos; priorizar `rounded-none`, `rounded-sm` o `rounded-md`).

---

## 3. Política de Cero Código Huérfano y Erradicación de Antipatrones

1. **Detección y Purga de Código Huérfano:**
   - Antes de dar por concluido un refactor, verificar mediante búsqueda global (`grep`) que no queden funciones, archivos `.ts`/`.tsx`, tipos o constantes obsoletas sin referencias.
   - Todo archivo reemplazado debe ser eliminado de forma limpia.
2. **Desacoplamiento de Mocks:**
   - Los datos simulados (mocks) solo pueden residir dentro de `tests/` o manejadores MSW de prueba.
   - No deben existir flags `isMock = true` quemados en componentes o servicios en producción.
3. **Manejo de Errores y Resiliencia UI:**
   - Todo componente debe proveer renderizado explícito para estados:
     1. **Loading:** Skeleton o spinner con contorno sólido.
     2. **Empty:** Ilustración o microcopy descriptivo con acción sugerida.
     3. **Error:** Mensaje legible, código de error técnico y botón de reintento.

---

## 4. Estándar de Pruebas y Evidencia Visual

1. **Pruebas Automatizadas (Vitest):**
   - Cobertura de lógica de dominio, hooks y componentes.
   - **Requisito mandatorio:** 100% de tests passing (`make test`).
2. **Evidencia Visual Automatizada (Puppeteer):**
   - Cada caso de uso debe contar con un script de captura headless (`scripts/capture-cuXX.mjs`) que interactúe con el portal en vivo y capture screenshots reales en `docs/assets/`.
   - La evidencia visual debe ilustrar estado default, interacción y resultado.

---

## 5. Gobernanza y Documentación RFC

1. Todo caso de uso debe estar respaldado por un documento RFC formal en `docs/rfcs/RFC-XX-backend-<slug>-contract.md`.
2. El RFC debe declarar el contrato OpenAPI, el mapa de resiliencia Tolerant Reader, la matriz de códigos de error y la conformidad con los ADRs de arquitectura.

---

## 6. Disciplina de Entrega y Git Workflow

Seguir estrictamente las normas definidas en `.agents/rules/git-workflow.md`:
1. Desarrollo en rama aislada `feat/<id>-<slug>`.
2. Commits atómicos con formato Conventional Commits (`feat(...)`, `test(...)`, `docs(...)`).
3. Validación previa a PR: `make test` y `make stack/build`.
4. Merge hacia `development` exclusivamente mediante **Squash and Merge**.
5. Promoción de `development` a `main` exclusivamente mediante **Merge Commit**.
