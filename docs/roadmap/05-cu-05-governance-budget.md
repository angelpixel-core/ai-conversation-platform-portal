# 📐 CU-05: Dashboard de Gobernanza de Tokens y Cuotas (Budget & Policy Engine)
## Hoja de Ruta Frontend (`apps/chatbot/web/portal/docs/roadmap/05-cu-05-governance-budget.md`)

| Atributo | Detalle |
| :--- | :--- |
| **Identificador** | **CU-05** |
| **Paso del Backend Walkthrough** | **Step 5: Tenant Governance, Policies & Cost Control** ([`AI_CONVERSATION_PLATFORM_API.README.md`](file:///Users/angel.szymczak/Vaults/Harvis/300-MEMORIA_DIGITAL/475-Sites/AngelSolutions/Company/platform/convo/chatbot-ai-rag-langchain/apps/chatbot/web/portal/docs/AI_CONVERSATION_PLATFORM_API.README.md#L435)) |
| **Slice Backend Vinculado** | Slice 6: Multi-Tenant Policy Engine, Dynamic Model Routing & Cost Budgets |
| **Endpoints Clave** | `GET /admin/tenants/{id}/budget`, `PATCH /admin/tenants/{id}/policy`, `POST /admin/tenants/{id}/reserve` |
| **Código HTTP Crítico** | `HTTP 402 Payment Required` (Rechazo de Cuota / Saldo Insuficiente) |
| **Estado de Implementación** | 🟡 Especificado (Listo para TDD) |

---

## 🎯 1. Objetivos de Negocio y Experiencia de Usuario (UX)

### 1.1 El Problema
Los modelos de lenguaje avanzados generan costos operacionales variables por consumo de tokens. Sin mecanismos de gobernanza visibles:
1. Una organización puede agotar imprevistamente su presupuesto mensual corporativo, deteniendo abruptamente las operaciones de sus usuarios.
2. Si un usuario intenta lanzar una consulta cuando la cuota está agotada y el backend responde `HTTP 402 Payment Required`, una interfaz no preparada mostrará un error genérico o colapsará, generando frustración.
3. Los administradores necesitan actualizar políticas dinámicas (modelos permitidos como `gpt-4o` o `claude-3-5-sonnet`, límite de tokens por consulta y techo presupuestario) sin reiniciar servidores.

### 1.2 La Solución Neubrutalism 3D
1. **`TokenBudgetMeter` (Medidor Segmentado Neubrutalism 3D):**
   - Panel de control en `/dashboard/governance` con borde negro de `3px`, sombra dura de `6px 6px 0px #000` y lienzo blanco papel.
   - Barra de progreso segmentada táctil de tres tramos:
     - 🟢 **Saldo Disponible:** Verde esmeralda (`#10B981`).
     - 🟡 **Cuota Reservada (In-Flight):** Amarillo cyber (`#FBBF24`).
     - ⚪ **Espacio Libre / Restante:** Gris neutro con cuadrícula técnica.
   - Indicador numérico en tipografía monoespaciada en negrita (`$1,000.00 USD disponibles`).
2. **`PolicyConfigForm` (Consola de Configuración de Políticas):**
   - Controles de selección de tier (`FREE`, `PRO`, `ENTERPRISE`), slider táctil para `max_tokens_per_request` (ej. 8192) y switches mecánicos 3D para activar/desactivar modelos (`gpt-4o`, `gpt-4o-mini`, `claude-3-5-sonnet`).
3. **`QuotaExceededModal` (Alerta Preventiva y de Bloqueo 402):**
   - Ante una respuesta `HTTP 402 Payment Required`, se despliega un modal de alta severidad con fondo ámbar/rojo de alto contraste, desglose del déficit presupuestario y botón de acción directa "Solicitar Ampliación de Saldo" sin congelar la aplicación.

---

## 🔌 2. Contrato de Integración API

### 2.1 Consultar Presupuesto del Tenant
- **Método:** `GET`
- **Ruta:** `/admin/tenants/{tenant_id}/budget`
- **Headers:** `Accept: application/json`
- **Respuesta 200 OK:**
  ```json
  {
    "tenant_id": "corp-acme",
    "balance": "1000.0000",
    "reserved_amount": "0.0000",
    "available_balance": "1000.0000",
    "currency": "USD"
  }
  ```

### 2.2 Actualizar Política Operativa del Tenant
- **Método:** `PATCH`
- **Ruta:** `/admin/tenants/{tenant_id}/policy`
- **Headers:** `Content-Type: application/json`
- **Payload:**
  ```json
  {
    "tier": "ENTERPRISE",
    "max_tokens_per_request": 8192,
    "monthly_budget_usd": "2500.00",
    "allowed_models": ["gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet"]
  }
  ```
- **Respuesta 200 OK:**
  ```json
  {
    "tenant_id": "corp-acme",
    "tier": "ENTERPRISE",
    "max_tokens_per_request": 8192,
    "monthly_budget_usd": "2500.0000",
    "allowed_models": ["claude-3-5-sonnet", "gpt-4o", "gpt-4o-mini"]
  }
  ```

### 2.3 Simulación / Reserva de Cuota
- **Método:** `POST`
- **Ruta:** `/admin/tenants/{tenant_id}/reserve`
- **Headers:**
  ```http
  Content-Type: application/json
  X-Tenant-Id: corp-acme
  ```
- **Payload:**
  ```json
  {
    "estimated_cost": "99999.00",
    "model_id": "gpt-4o"
  }
  ```
- **Respuesta 402 Payment Required (Cuota Excedida):**
  ```json
  {
    "detail": "Presupuesto insuficiente o cuota excedida para el tenant 'corp-acme'. Cuota excedida para tenant 'corp-acme'. Solicitado: 99999.00, Disponible: 1000.0000"
  }
  ```

---

## 🏛️ 3. Arquitectura Frontend (Clean Architecture)

```
src/
├── domain/governance/
│   ├── MonetaryBudget.ts         # Value Object: balance, reserved, available, currency
│   ├── TenantPolicy.ts           # Entidad: tier, maxTokens, monthlyBudget, allowedModels
│   └── QuotaException.ts         # Error de dominio con requestedAmount y availableAmount
├── application/governance/
│   ├── useTenantBudget.ts        # Hook reactivo de polling y balance
│   ├── useUpdateTenantPolicy.ts  # Mutación para actualizar tiers y políticas
│   └── useQuotaGuard.ts          # Interceptor / Guard ante respuestas HTTP 402
├── infrastructure/api/
│   └── governanceClient.ts       # Adaptador HTTP para endpoints de /admin/tenants
└── presentation/components/governance/
    ├── TokenBudgetMeter.tsx      # Barra de progreso segmentada 3D
    ├── PolicyConfigForm.tsx      # Formulario táctil neubrutalista
    ├── ModelSelectorChips.tsx    # Chips de selección de modelos habilitados
    └── QuotaExceededModal.tsx    # Modal de alerta ante HTTP 402
```

### 3.1 Value Object: `MonetaryBudget` (`domain/governance/MonetaryBudget.ts`)
```typescript
export class MonetaryBudget {
  constructor(
    public readonly tenantId: string,
    public readonly balance: number,
    public readonly reservedAmount: number,
    public readonly availableBalance: number,
    public readonly currency: string = 'USD'
  ) {}

  get usagePercentage(): number {
    if (this.balance <= 0) return 100;
    const usedOrReserved = this.reservedAmount;
    return Math.min(100, Math.round((usedOrReserved / this.balance) * 100));
  }

  get isLowBudget(): boolean {
    return this.availableBalance < this.balance * 0.15; // Menos del 15% restante
  }

  get isExhausted(): boolean {
    return this.availableBalance <= 0;
  }
}
```

### 3.2 Interceptor Global de Exceso de Cuota (`application/governance/useQuotaGuard.ts`)
```typescript
import { apiClient } from '@/infrastructure/api/apiClient';
import { useModalStore } from '@/application/stores/useModalStore';

export function setupQuotaInterceptor() {
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 402) {
        const detail = error.response.data?.detail || 'Cuota agotada';
        useModalStore.getState().openQuotaModal({ detail });
      }
      return Promise.reject(error);
    }
  );
}
```

---

## 🧪 4. Especificación BDD en Gherkin (`.feature`)

Archivo: `tests/e2e/features/cu-05-governance-budget.feature`

```gherkin
Feature: CU-05 - Control Presupuestario de Tokens y Gobernanza
  Como administrador del tenant "corp-acme"
  Quiero supervisar el consumo de tokens y los límites de las políticas
  Para evitar sobrecostos y responder ante contingencias de cuota agotada

  Background:
    Given que el tenant "corp-acme" tiene un presupuesto asignado de "1000.00" USD
    And el usuario accede a la sección "/dashboard/governance"

  Scenario: Visualización del medidor de presupuesto y balance (Happy Path)
    When carga el panel de gobernanza
    Then visualizo el componente "TokenBudgetMeter" con borde negro de 3px y sombra "6px 6px 0px #000"
    And el balance disponible muestra "$1,000.00 USD"
    And el porcentaje de uso indica "0%" en color verde esmeralda

  Scenario: Actualización de política operativa del tenant
    When el administrador cambia el Tier a "ENTERPRISE"
    And define el límite de tokens por petición en "8192"
    And activa el modelo "claude-3-5-sonnet"
    And presiona "Guardar Cambios de Política"
    Then se envía una petición PATCH a "/admin/tenants/corp-acme/policy"
    And se presenta una notificación neubrutalista verde de "Política Actualizada con Éxito"

  Scenario: Detección y despliegue del modal ante cuota agotada (HTTP 402)
    Given que el tenant tiene saldo disponible de "$0.00 USD"
    When un usuario intenta enviar un mensaje en el chat
    Then el backend rechaza la operación con código HTTP 402
    And se despliega de inmediato el modal "QuotaExceededModal" con borde rojo y sombra 3D
    And se informa "Presupuesto insuficiente o cuota excedida"
    And no se congela la navegación del portal
```

---

## 🛠️ 5. Mock Service Worker (MSW) Handlers & Fixtures

```typescript
// src/mocks/handlers/governanceHandlers.ts
import { http, HttpResponse, delay } from 'msw';

let currentBudget = {
  tenant_id: 'corp-acme',
  balance: '1000.0000',
  reserved_amount: '0.0000',
  available_balance: '1000.0000',
  currency: 'USD',
};

export const governanceHandlers = [
  // GET Budget
  http.get('http://localhost:8000/admin/tenants/:id/budget', async () => {
    await delay(60);
    return HttpResponse.json(currentBudget);
  }),

  // PATCH Policy
  http.patch('http://localhost:8000/admin/tenants/:id/policy', async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json({
      tenant_id: 'corp-acme',
      tier: body.tier || 'ENTERPRISE',
      max_tokens_per_request: body.max_tokens_per_request || 8192,
      monthly_budget_usd: body.monthly_budget_usd || '2500.0000',
      allowed_models: body.allowed_models || ['gpt-4o', 'claude-3-5-sonnet'],
    });
  }),

  // POST Reserve Quota
  http.post('http://localhost:8000/admin/tenants/:id/reserve', async ({ request }) => {
    const body = (await request.json()) as any;
    const cost = parseFloat(body.estimated_cost);

    if (cost > parseFloat(currentBudget.available_balance)) {
      return HttpResponse.json(
        {
          detail: `Presupuesto insuficiente o cuota excedida para el tenant. Solicitado: ${cost}, Disponible: ${currentBudget.available_balance}`,
        },
        { status: 402 }
      );
    }

    return HttpResponse.json({ reservation_id: 'res-abc-123', status: 'RESERVED' });
  }),
];
```

---

## 🔬 6. Estrategia TDD (Vitest & React Testing Library)

1. **`MonetaryBudget.test.ts` (Unit Test):**
   - Evalúa cálculos de `usagePercentage` con decimales.
   - Verifica banderas `isLowBudget` (<15%) y `isExhausted` (disponible <= 0).
2. **`useTenantBudget.test.ts` (Hook Test con MSW):**
   - Valida la carga inicial del presupuesto y el refresco tras mutaciones.
   - Simula la recepción de error 402 y comprueba que active el store del modal.
3. **`TokenBudgetMeter.test.tsx` (Component Test):**
   - Comprueba la estética Neubrutalism (`border-3 border-black`, `shadow-[6px_6px_0px_#000]`).
   - Verifica que el indicador cambie de color a amarillo o rojo cuando el presupuesto baja del umbral de seguridad.
4. **`QuotaExceededModal.test.tsx` (Component Test):**
   - Valida que renderice el mensaje de error estructurado y el botón de acción para contactar a administración.

---

## 🚀 7. Propuestas de Mejora para el Backend (Feedback / RFC)

Durante el diseño de la gobernanza de costos y cuotas, se proponen los siguientes RFCs para el backend:

### RFC-13: Distinción Estricta entre `HTTP 402` y `HTTP 429`
- **Situación Actual:** En algunas documentaciones genéricas se confunde la cuota de saldo con el límite de peticiones por minuto (*Rate Limiting*).
- **Propuesta:** Reservar exclusivamente:
  - `HTTP 402 Payment Required`: Para saldo monetario/tokens insuficiente en el tenant.
  - `HTTP 429 Too Many Requests`: Para exceder el límite de concurrencia o peticiones por minuto (RPM/TPM).
- **Beneficio Frontend:** Permite al portal mostrar modales distintos: uno comercial/administrativo (para recargar presupuesto) y otro de espera/reintento automático con backoff (para rate limit).

### RFC-14: Historial de Deducciones y Transacciones de Cuota (`GET .../budget/ledger`)
- **Situación Actual:** El endpoint `/budget` retorna únicamente una foto instantánea del balance actual. No existe un endpoint para auditar los débitos pasados.
- **Propuesta:** Exponer:
  ```http
  GET /admin/tenants/{tenant_id}/budget/ledger?limit=50
  ```
  Retornando registros con `conversation_id`, `tokens_prompt`, `tokens_completion`, `cost_usd`, y `model_used`.
- **Beneficio Frontend:** Permite graficar en el portal la curva de consumo histórico de tokens por día y por modelo.

### RFC-15: Evento SSE de Advertencia de Umbral Presupuestario (`event: budget_warning`)
- **Propuesta:** Cuando una conversación en streaming ejecute un débito que sitúe el saldo restante por debajo del 20%, emitir un evento en el canal SSE:
  ```http
  event: budget_warning
  data: {"remaining_balance_usd": "45.20", "threshold_pct": 10}
  ```
- **Beneficio:** Permite alertar visualmente al usuario antes de que la siguiente consulta resulte en un rechazo 402.

---

## ✅ 8. Criterios de Aceptación (Definition of Done - DoD)

- [ ] Value Object `MonetaryBudget` creado en `domain/governance/` con suite unitaria completa.
- [ ] Hook `useTenantBudget` configurado con polling y actualización reactiva en `application/governance/`.
- [ ] Interceptor de red configurado para capturar `HTTP 402` y activar `QuotaExceededModal`.
- [ ] Componente `TokenBudgetMeter` maquetado con barras segmentadas Neubrutalism 3D.
- [ ] Formulario `PolicyConfigForm` interactivo con switches mecánicos y validación de tipos.
- [ ] Handlers MSW configurados para simular balance y rechazo 402.
- [ ] Escenarios Gherkin de CU-05 listos para ejecución en Playwright-BDD.
