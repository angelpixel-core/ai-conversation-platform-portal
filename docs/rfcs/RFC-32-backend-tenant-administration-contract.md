# RFC-32: Contrato Estandarizado de Administración y Aislamiento Multi-Tenant (`/admin/tenants`)

- **RFC Number:** RFC-32
- **Título:** Especificación del Contrato de Gestión, Aislamiento y Metadatos de Inquilinos Multi-Tenant
- **Fecha:** 2026-10-15
- **Autor:** Equipo Frontend Portal (Portal Web & Clean Architecture)
- **Destinatarios:** Equipo Backend (`apps/chatbot/service/api`), Seguridad y Arquitectura de Datos
- **Estado:** PROPUESTO (En proceso de adopción)
- **Caso de Uso Vinculado:** CU-02: Aislamiento y Contexto Multi-Tenant

---

## 1. Resumen Ejecutivo

Este documento formaliza y propone el contrato de API unificado para la gestión y consulta de organizaciones/inquilinos (`Tenants`) bajo la ruta administrativa `/admin/tenants` del motor conversacional (`FastAPI / Uvicorn`).

Durante la auditoría de integración del **CU-02 (Aislamiento y Contexto Multi-Tenant)**, se identificaron asimetrías de nomenclatura entre las operaciones de lectura (`GET /admin/tenants`) y escritura (`POST /admin/tenants`), así como la necesidad de consolidar el ciclo de vida de cuotas, balances financieros y aislamiento estricto entre organizaciones.

Para garantizar la integridad de datos, prevenir contaminaciones cruzadas (*Cross-Tenant Data Leaks*) y facilitar la administración en el portal web y sistemas externos (ERP/Billing), este documento establece:
1. La unificación de identificadores (`id` vs `tenant_id`).
2. El esquema unificado de lectura (`TenantSummaryResponse`) y creación (`CreateTenantRequest`).
3. El catálogo oficial de niveles de servicio (`TenantTier`).
4. Las directrices de propagación del encabezado `X-Tenant-Id` en todos los servicios derivados.
5. El patrón de diseño *Tolerant Reader* implementado en el portal frontend para mantener retrocompatibilidad total sin tiempo de inactividad (*Zero-Downtime Transition*).

---

## 2. Diagnóstico de la Auditoría y Hallazgos Actuales

### 2.1 Estado del Endpoint en Producción/Local

Al consultar el backend real (`http://localhost:8000/admin/tenants`):
```json
[
  {
    "tenant_id": "corp-acme",
    "name": "ACME Corporation",
    "status": "ACTIVE",
    "tier": "STANDARD",
    "balance": "1000.0000",
    "reserved_amount": "0.0000",
    "available_balance": "1000.0000",
    "currency": "USD"
  },
  {
    "tenant_id": "default-tenant",
    "name": "Default System Tenant",
    "status": "ACTIVE",
    "tier": "STANDARD",
    "balance": "1000.0000",
    "reserved_amount": "0.0000",
    "available_balance": "1000.0000",
    "currency": "USD"
  }
]
```

### 2.2 Discrepancias Detectadas

1. **Inconsistencia de Identificador Principal:**
   - `GET /admin/tenants` retorna el campo `tenant_id`.
   - `POST /admin/tenants` según el esquema OpenAPI requiere el campo `id`.
   - *Impacto:* Obliga al cliente a realizar normalizaciones ad-hoc. Se propone que el backend soporte ambos en lectura o exponga `id` como canónico, manteniendo `tenant_id` como alias transitorio.
2. **Niveles de Servicio (`tier`):**
   - El backend expone `STANDARD` como valor por defecto, mientras que los contratos previos de dominio asumían `FREE | PRO | ENTERPRISE`.
   - Se debe formalizar la enumeración canónica soportada.
3. **Formatos de Balances Financieros:**
   - El endpoint actual devuelve cadenas numéricas de 4 decimales (`"1000.0000"`). 
   - Se recomienda documentar si el tipo es Decimal serializado como string (para evitar pérdidas de precisión IEEE 754) o número flotante.
4. **Metadatos de Auditoría Ausentes:**
   - Ni `GET` ni `POST` incluyen marcas temporales (`created_at`, `updated_at`), avatar/logo corporativo, ni límites de tasa de peticiones (*Rate Limiting* en RPM).

---

## 3. Especificación Técnica Propuesta

### 3.1 Catálogo Canónico de Niveles (`TenantTier`)

Se definen formalmente los siguientes cuatro niveles de servicio corporativo:

| Nivel | Identificador | Tokens Max / Request | SLA Garantizado | Descripción |
|---|---|---|---|---|
| **Free** | `FREE` | 2,048 tokens | Esfuerzo Máximo (Best-Effort) | Cuentas comunitarias y pilotos de prueba. |
| **Standard** | `STANDARD` | 4,096 tokens | 99.5% Uptime | Nivel comercial estándar para pequeñas y medianas empresas. |
| **Pro** | `PRO` | 8,192 tokens | 99.9% Uptime | Cuentas profesionales con streaming prioritario y soporte RAG. |
| **Enterprise**| `ENTERPRISE` | 16,384 tokens | 99.99% Uptime | Aislamiento dedicado, modelos fine-tuned, presupuesto expandido. |

---

### 3.2 Esquema Unificado de Lectura: `TenantSummaryResponse`

**Ruta:** `GET /admin/tenants`  
**Cabeceras Requeridas:** `Accept: application/json`

```json
[
  {
    "id": "corp-acme",
    "tenant_id": "corp-acme",
    "name": "ACME Corporation",
    "status": "ACTIVE",
    "tier": "ENTERPRISE",
    "financials": {
      "currency": "USD",
      "balance": "5000.0000",
      "reserved_amount": "0.0000",
      "available_balance": "5000.0000",
      "monthly_budget_usd": "10000.00"
    },
    "limits": {
      "max_tokens_per_request": 16384,
      "max_requests_per_minute": 120
    },
    "metadata": {
      "created_at": "2026-09-15T10:00:00Z",
      "updated_at": "2026-10-15T11:30:00Z",
      "contact_email": "ops@acme.corp"
    }
  }
]
```

> **Nota de Compatibilidad:** Mientras se completa la transición a la estructura `financials` y `limits`, el backend puede seguir respondiendo los campos aplanados (`balance`, `available_balance`, `currency`), pero asegurando que tanto `id` como `tenant_id` estén presentes en el objeto raíz.

---

### 3.3 Esquema Unificado de Creación: `CreateTenantRequest`

**Ruta:** `POST /admin/tenants`  
**Cabeceras Requeridas:** `Content-Type: application/json`  
**Código de Éxito:** `201 Created`

```json
{
  "id": "corp-globex",
  "name": "Globex Industries",
  "tier": "STANDARD",
  "balance_usd": "1000.00",
  "monthly_budget_usd": "500.00",
  "max_tokens_per_request": 4096,
  "max_requests_per_minute": 60,
  "contact_email": "admin@globex.com"
}
```

#### Validación de Invariantes:
1. `id`: Cadena de 3 a 50 caracteres que coincida con la expresión regular `^[a-z0-9-]+$`.
2. `name`: Nombre descriptivo de 2 a 100 caracteres.
3. `tier`: Uno de los valores enumerados: `"FREE"`, `"STANDARD"`, `"PRO"`, `"ENTERPRISE"`.
4. `balance_usd`: Valor numérico decimal positivo mayor o igual a `0.00`.

---

## 4. Política de Aislamiento y Seguridad en Tiempo de Ejecución

### 4.1 Propagación de `X-Tenant-Id`
Para cumplir con los estándares de aislamiento estricto (CU-02):
1. **Inyección en Gateway:** Todas las solicitudes a endpoints de negocio (`/conversations`, `/chat`, `/rag`, `/outbox`, etc.) deben incluir la cabecera HTTP:
   ```http
   X-Tenant-Id: corp-acme
   ```
2. **Aislamiento en Nivel de Base de Datos (Row-Level Security o Tenant Schema):** El backend debe filtrar todas las consultas SQL mediante `WHERE tenant_id = :current_tenant`.
3. **Caché y Mensajería:** Las llaves en Redis y colas en RabbitMQ deben incorporar el prefijo del tenant: `tenant:{tenant_id}:*` para evitar fuga de mensajes o envenenamiento de caché.

---

## 5. Implementación en el Frontend: Patrón Tolerant Reader

Para no depender de un despliegue sincronizado del backend, el frontend ha implementado en `src/infrastructure/api/HttpTenantAdapter.ts` un lector tolerante:

```typescript
// Tolerant Reader: resuelve id tanto si viene como "tenant_id" o como "id"
const rawId = raw.id || raw.tenant_id;
const rawTier = (raw.tier || 'STANDARD').toUpperCase();

const tier: TenantTier =
  rawTier === 'ENTERPRISE' ? 'ENTERPRISE' :
  rawTier === 'STANDARD' ? 'STANDARD' :
  rawTier === 'PRO' ? 'PRO' : 'FREE';

return new Tenant(
  TenantId.create(rawId),
  raw.name || rawId,
  tier,
  new Date(),
  {
    status: raw.status || 'ACTIVE',
    balance: raw.balance != null ? String(raw.balance) : undefined,
    reservedAmount: raw.reserved_amount != null ? String(raw.reserved_amount) : undefined,
    availableBalance: raw.available_balance != null ? String(raw.available_balance) : undefined,
    currency: raw.currency || 'USD',
    rawPayload: raw,
  }
);
```

Adicionalmente, al invocar `createTenant`:
```typescript
const payload = {
  id: input.id,
  tenant_id: input.id, // Compatibilidad dual
  name: input.name,
  tier: input.tier,
  balance_usd: input.balanceUsd ?? input.initialBudgetUsd ?? 0,
};
```

---

## 6. Plan de Transición Recomendado

1. **Semana 1 (Inmediato):** Backend asegura que `GET /admin/tenants` devuelva tanto `id` como `tenant_id` en cada objeto.
2. **Semana 2:** Backend valida y normaliza el campo `tier` permitiendo `"STANDARD"` en adición a los tiers existentes.
3. **Semana 3:** Se publica la versión formal del esquema `TenantSummaryResponse` con subobjetos `financials` y `limits`.
4. **Semana 4:** Deprecación programada del campo plano `tenant_id` en favor de `id` con un período de gracia de 60 días.

---

## 7. Aprobaciones Requeridas

- [ ] Líder Técnico Frontend
- [ ] Arquitecto de Software Backend
- [ ] Especialista en Seguridad y Compliance (Data Privacy Officer)
