# 📐 CU-02: Contexto y Selector de Tenant Multi-Tenant (Data Isolation)
## Hoja de Ruta Frontend (`apps/chatbot/web/portal/docs/roadmap/02-cu-02-tenant-isolation.md`)

| Atributo | Detalle |
| :--- | :--- |
| **Identificador** | **CU-02** |
| **Paso del Backend Walkthrough** | **Step 2: Multi-Tenancy & Data Isolation** ([`AI_CONVERSATION_PLATFORM_API.README.md`](file:///Users/angel.szymczak/Vaults/Harvis/300-MEMORIA_DIGITAL/475-Sites/AngelSolutions/Company/platform/convo/chatbot-ai-rag-langchain/apps/chatbot/web/portal/docs/AI_CONVERSATION_PLATFORM_API.README.md#L317)) |
| **Slice Backend Vinculado** | Slice 6: Multi-Tenant Policy Engine, Dynamic Model Routing & Cost Budgets |
| **Endpoints Clave** | `GET /admin/tenants`, `POST /admin/tenants`, Header HTTP `X-Tenant-Id` |
| **Estado de Implementación** | 🟡 Especificado (Listo para TDD) |

---

## 🎯 1. Objetivos de Negocio y Experiencia de Usuario (UX)

### 1.1 El Problema
La plataforma opera en un entorno corporativo **estrictamente multi-inquilino (Multi-Tenant)**. Un operador o directivo corporativo puede gestionar o consultar información de múltiples organizaciones (por ejemplo, `corp-acme` y `corp-globex`). Es un riesgo de seguridad crítico que una petición se envíe sin el contexto del tenant adecuado o que datos confidenciales de una empresa se mezclen en la pantalla de otra (*Cross-Tenant Data Leakage*).

### 1.2 La Solución Neubrutalism 3D
1. **`TenantSelectorDropdown` (Componente de Cabecera):**
   - Selector táctil situado en la barra de navegación superior junto al `SystemStatusPill`.
   - Borde negro rígido de `2px`, sombra plana de `4px 4px 0px #000`, tipografía sans-serif de alto contraste y avatar corporativo con iniciales en bloques de color retro.
   - Badge indicador del nivel contratado por el tenant (`FREE` en gris pizarra, `PRO` en cian brillante, `ENTERPRISE` en cyber yellow `#FBBF24`).
   - Menú desplegable con elevación 3D (`box-shadow: 6px 6px 0px #000;`) y animación de despliegue mecánico.
2. **`TenantSwitchGuardModal` (Prevención de Contaminación Cruzada):**
   - Si el operador intenta cambiar de empresa mientras tiene una conversación activa o una herramienta en ejecución, un modal Neubrutalism 3D solicita confirmación explícita para limpiar el estado volátil de la vista y conmutar el contexto de forma segura.
3. **Inyección Transparente de Contexto:**
   - Una vez seleccionado el tenant, todas las peticiones HTTP y suscripciones SSE inyectan de manera obligatoria y automática la cabecera `X-Tenant-Id: <slug>`.

---

## 🔌 2. Contrato de Integración API

### 2.1 Cabecera HTTP Obligatoria
En todos los endpoints de negocio (conversaciones, mensajes, streaming, RAG, workflows, governance):
```http
X-Tenant-Id: corp-acme
```

### 2.2 Endpoints de Administración de Tenants

#### 1. Listar Empresas Registradas
- **Método:** `GET`
- **Ruta:** `/admin/tenants`
- **Respuesta 200 OK:**
  ```json
  [
    {
      "id": "corp-acme",
      "name": "Acme Corporation",
      "tier": "ENTERPRISE",
      "created_at": "2026-09-20T10:00:00Z"
    },
    {
      "id": "corp-globex",
      "name": "Globex Industries",
      "tier": "PRO",
      "created_at": "2026-09-22T14:30:00Z"
    }
  ]
  ```

#### 2. Provisionar Nueva Organización Tenant
- **Método:** `POST`
- **Ruta:** `/admin/tenants`
- **Payload:**
  ```json
  {
    "tenant_id": "corp-initech",
    "name": "Initech Systems",
    "tier": "ENTERPRISE",
    "initial_budget_usd": "1500.00"
  }
  ```
- **Respuesta 201 Created:** Retorna el objeto `TenantResponse` creado.

### 2.3 Manejo de Errores de Multi-Tenancy

- **HTTP 400 Bad Request / 403 Forbidden:** Si el tenant no existe o no se suministra la cabecera en una ruta protegida:
  ```json
  {
    "type": "https://errors.angelpixel.io/missing-tenant",
    "title": "Tenant Context Required",
    "status": 400,
    "detail": "El recurso solicitado requiere la especificación del contexto corporativo mediante la cabecera 'X-Tenant-Id'."
  }
  ```

---

## 🏛️ 3. Arquitectura Frontend (Clean Architecture)

```
src/
├── domain/tenants/
│   ├── TenantId.ts               # Value Object: validación regex ^[a-z0-9-]+$
│   ├── Tenant.ts                 # Entidad: id, name, tier, status
│   └── TenantTier.ts             # Enum / Type: 'FREE' | 'PRO' | 'ENTERPRISE'
├── application/tenants/
│   ├── TenantContext.tsx         # React Context & Provider de sesión multi-tenant
│   ├── useTenant.ts              # Hook para consumir el tenant activo
│   └── useTenantsList.ts         # Hook TanStack Query para /admin/tenants
├── infrastructure/
│   ├── api/
│   │   ├── apiClient.ts          # Axios / Fetch Interceptor que inyecta 'X-Tenant-Id'
│   │   └── tenantsAdminClient.ts # Funciones remotas para /admin/tenants
│   └── storage/
│       └── tenantSessionStore.ts # Persistencia en SessionStorage / Cookie segura
└── presentation/
    ├── components/tenants/
    │   ├── TenantSelectorDropdown.tsx # Dropdown Neubrutalism 3D
    │   ├── TenantAvatar.tsx           # Bloque visual de iniciales
    │   ├── TenantTierBadge.tsx        # Etiqueta con sombra plana
    │   └── TenantSwitchGuardModal.tsx # Modal de confirmación al cambiar tenant
    └── guards/TenantProtectedLayout.tsx # Bloqueo si no hay tenant seleccionado
```

### 3.1 Value Object: `TenantId` (`domain/tenants/TenantId.ts`)
```typescript
export class TenantId {
  private static readonly SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  private constructor(public readonly value: string) {
    if (!TenantId.SLUG_REGEX.test(value)) {
      throw new Error(`TenantId inválido: '${value}'. Debe ser un slug en minúsculas.`);
    }
  }

  public static create(value: string): TenantId {
    const normalized = value.trim().toLowerCase();
    return new TenantId(normalized);
  }

  public equals(other: TenantId): boolean {
    return this.value === other.value;
  }
}
```

### 3.2 Interceptor de Peticiones (`infrastructure/api/apiClient.ts`)
```typescript
import axios from 'axios';
import { tenantSessionStore } from '../storage/tenantSessionStore';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const activeTenant = tenantSessionStore.getActiveTenant();
  if (activeTenant) {
    config.headers.set('X-Tenant-Id', activeTenant.value);
  }
  return config;
});
```

---

## 🧪 4. Especificación BDD en Gherkin (`.feature`)

Archivo: `tests/e2e/features/cu-02-tenant-isolation.feature`

```gherkin
Feature: CU-02 - Contexto y Aislamiento Multi-Tenant
  Como administrador corporativo u operador
  Quiero seleccionar el espacio de trabajo de mi empresa
  Para garantizar que mis peticiones y datos estén estrictamente aislados

  Background:
    Given que existen los tenants registrados "corp-acme" (Enterprise) y "corp-globex" (Pro)
    And el usuario accede al portal en "/dashboard"

  Scenario: Selección de empresa y propagación de cabecera contextual (Happy Path)
    When abro el selector de empresa "TenantSelectorDropdown"
    And selecciono la organización "Acme Corporation (corp-acme)"
    Then el selector refleja "Acme Corporation" con badge "ENTERPRISE" en color amarillo cyber
    And todas las llamadas HTTP salientes incluyen la cabecera "X-Tenant-Id: corp-acme"
    And el identificador se almacena en el almacenamiento de sesión

  Scenario: Prevención de fuga de datos al conmutar de empresa
    Given que el usuario tiene activa la conversación "conv-123" en "corp-acme"
    When el usuario selecciona cambiar al tenant "corp-globex"
    Then se presenta el modal de alerta "TenantSwitchGuardModal"
    When el usuario confirma "Cambiar Espacio de Trabajo"
    Then la vista de conversación se limpia automáticamente
    And las nuevas peticiones se emiten con cabecera "X-Tenant-Id: corp-globex"
    And no se muestran mensajes ni recursos del tenant previo

  Scenario: Bloqueo de peticiones si no hay contexto de tenant
    Given que el usuario no tiene ninguna empresa seleccionada
    When intenta acceder a "/dashboard/chat"
    Then es redirigido a la pantalla de selección de tenant o modal obligatorio
```

---

## 🛠️ 5. Mock Service Worker (MSW) Handlers & Fixtures

```typescript
// src/mocks/handlers/tenantHandlers.ts
import { http, HttpResponse, delay } from 'msw';

export const mockTenants = [
  {
    id: 'corp-acme',
    name: 'Acme Corporation',
    tier: 'ENTERPRISE',
    created_at: '2026-09-20T10:00:00Z',
  },
  {
    id: 'corp-globex',
    name: 'Globex Industries',
    tier: 'PRO',
    created_at: '2026-09-22T14:30:00Z',
  },
];

export const tenantHandlers = [
  // Listar tenants
  http.get('http://localhost:8000/admin/tenants', async () => {
    await delay(80);
    return HttpResponse.json(mockTenants);
  }),

  // Crear nuevo tenant
  http.post('http://localhost:8000/admin/tenants', async ({ request }) => {
    const body = (await request.json()) as any;
    const newTenant = {
      id: body.tenant_id,
      name: body.name,
      tier: body.tier || 'PRO',
      created_at: new Date().toISOString(),
    };
    return HttpResponse.json(newTenant, { status: 201 });
  }),

  // Interceptor para validar presencia de X-Tenant-Id en rutas protegidas
  http.all('http://localhost:8000/conversations*', ({ request }) => {
    const tenantHeader = request.headers.get('X-Tenant-Id') || request.headers.get('x-tenant-id');
    if (!tenantHeader) {
      return HttpResponse.json(
        { error: 'MissingTenantContext', detail: 'Cabecera X-Tenant-Id requerida' },
        { status: 400 }
      );
    }
    return undefined; // Continúa hacia el handler específico
  }),
];
```

---

## 🔬 6. Estrategia TDD (Vitest & React Testing Library)

1. **`TenantId.test.ts` (Unit Test):**
   - Valida slugs correctos (`corp-acme`, `initech-1`, `dev-team-alpha`).
   - Rechaza formatos inválidos con espacios, mayúsculas o caracteres especiales (`Corp Acme`, `test@corp`, `$$$`).
2. **`apiClientInterceptor.test.ts` (Integration Test con MSW):**
   - Configura un tenant activo en el store.
   - Ejecuta una petición ficticia y verifica que `config.headers['X-Tenant-Id']` coincida exactamente.
3. **`TenantSelectorDropdown.test.tsx` (Component Test):**
   - Renderiza la lista de empresas devuelta por MSW.
   - Comprueba estilos Neubrutalism (`border-2 border-black`, `shadow-[4px_4px_0px_#000]`).
   - Verifica el cambio de tenant al disparar eventos de click y la emisión del callback correspondiente.

---

## 🚀 7. Propuestas de Mejora para el Backend (Feedback / RFC)

Durante el diseño de la integración del selector de tenant en el frontend, se detectaron los siguientes puntos de optimización para el backend:

### RFC-04: Estandarización de la Capitalización de `X-Tenant-Id`
- **Situación Actual:** En algunos ejemplos del README se referencia `X-Tenant-ID` (con `ID` en mayúsculas) y en la especificación OpenAPI aparece como `X-Tenant-Id`. Si bien HTTP/1.1 y HTTP/2 especifican que las cabeceras son case-insensitive, clientes proxy o validadores intermedios pueden generar discrepancias.
- **Propuesta:** Formalizar en los schemas de FastAPI `X-Tenant-Id` como nombre canónico oficial y documentarlo en el OpenAPI spec.

### RFC-05: Endpoint de Perfil Ligero para Tenants (`GET /tenants/me` o `GET /tenants/{id}/profile`)
- **Situación Actual:** Para obtener información de la empresa actual (nombre, tier, cuotas), el frontend depende de endpoints bajo el prefijo `/admin/tenants`. En una arquitectura de producción con roles de usuario, un operador regular no debería tener acceso a listar todas las empresas registradas (`GET /admin/tenants`).
- **Propuesta:** Crear un endpoint público/restringido al tenant en sesión:
  ```http
  GET /tenants/{tenant_id}/profile
  ```
  Que devuelva solo los metadatos necesarios para el encabezado (`name`, `tier`, `logo_url`).

### RFC-06: Código de Error Estándar RFC 7807 para Falta de Tenant
- **Propuesta:** Si una petición a una ruta de conversación omite la cabecera de tenant, devolver `HTTP 401 Unauthorized` o `HTTP 403 Forbidden` en lugar de un `400 Bad Request` genérico, con el tipo de problema estructurado:
  ```json
  {
    "type": "https://errors.angelpixel.io/tenant-context-required",
    "title": "Tenant Context Required",
    "status": 403,
    "detail": "Acceso denegado: debe especificar la organización vía la cabecera 'X-Tenant-Id'."
  }
  ```

---

## ✅ 8. Criterios de Aceptación (Definition of Done - DoD)

- [ ] Value Object `TenantId` implementado en `domain/tenants/` con suite unitaria completa.
- [ ] Contexto y Provider `TenantContext` creados en `application/tenants/`.
- [ ] Interceptor de red configurado en `infrastructure/api/apiClient.ts` inyectando `X-Tenant-Id`.
- [ ] Componente `TenantSelectorDropdown` con diseño Neubrutalism 3D, badges de tier y soporte dark mode.
- [ ] Modal de confirmación `TenantSwitchGuardModal` implementado para prevenir cross-tenant leakage.
- [ ] Handlers MSW configurados en `src/mocks/handlers/tenantHandlers.ts`.
- [ ] Escenarios Gherkin de CU-02 listos para ejecución en Playwright-BDD.
