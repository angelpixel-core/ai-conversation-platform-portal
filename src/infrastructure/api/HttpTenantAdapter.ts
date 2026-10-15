import { TenantGatewayPort, CreateTenantInput } from '@/domain/tenants/TenantGatewayPort';
import { Tenant } from '@/domain/tenants/Tenant';
import { TenantId } from '@/domain/tenants/TenantId';
import { TenantTier } from '@/domain/tenants/TenantTier';

export interface RawTenantResponse {
  id?: string;
  tenant_id?: string;
  name: string;
  status?: string;
  tier?: string;
  balance?: string;
  reserved_amount?: string;
  available_balance?: string;
  currency?: string;
  created_at?: string;
  [key: string]: unknown;
}

export class HttpTenantAdapter implements TenantGatewayPort {
  constructor(private readonly baseUrl: string = 'http://localhost:8000') {}

  async getTenants(): Promise<Tenant[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/admin/tenants`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
    } catch (err: unknown) {
      // If direct fetch fails in browser, try same-origin proxy
      if (typeof window !== 'undefined' && this.baseUrl && this.baseUrl.startsWith('http')) {
        response = await fetch('/admin/tenants', {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
      } else {
        clearTimeout(timeoutId);
        throw err;
      }
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`Error fetching tenants: HTTP ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as RawTenantResponse[];
    return data.map((raw) => {
      const rawId = raw.id || raw.tenant_id || 'default';
      let tier: TenantTier = 'PRO';
      if (raw.tier) {
        const upper = raw.tier.toUpperCase();
        if (upper === 'ENTERPRISE' || upper === 'STANDARD' || upper === 'PRO' || upper === 'FREE') {
          tier = upper;
        }
      }
      const createdAt = raw.created_at ? new Date(raw.created_at) : new Date();

      return new Tenant(TenantId.create(rawId), raw.name, tier, createdAt, {
        status: raw.status || 'ACTIVE',
        balance: raw.balance,
        reservedAmount: raw.reserved_amount,
        availableBalance: raw.available_balance ?? raw.balance,
        currency: raw.currency || 'USD',
        rawPayload: raw as Record<string, unknown>,
      });
    });
  }

  async createTenant(input: CreateTenantInput): Promise<Tenant> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const budget = input.balanceUsd ?? input.initialBudgetUsd ?? '1000.00';

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/admin/tenants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          id: input.id,
          tenant_id: input.id,
          name: input.name,
          tier: input.tier,
          balance_usd: budget,
          initial_budget_usd: budget,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`Error creating tenant: HTTP ${response.status} ${response.statusText}`);
    }

    const raw = (await response.json()) as RawTenantResponse;
    const rawId = raw.id || raw.tenant_id || input.id;
    let tier: TenantTier = input.tier;
    if (raw.tier) {
      const upper = raw.tier.toUpperCase();
      if (upper === 'ENTERPRISE' || upper === 'STANDARD' || upper === 'PRO' || upper === 'FREE') {
        tier = upper;
      }
    }
    const createdAt = raw.created_at ? new Date(raw.created_at) : new Date();

    return new Tenant(TenantId.create(rawId), raw.name, tier, createdAt, {
      status: raw.status || 'ACTIVE',
      balance: raw.balance,
      reservedAmount: raw.reserved_amount,
      availableBalance: raw.available_balance ?? raw.balance,
      currency: raw.currency || 'USD',
      rawPayload: raw as Record<string, unknown>,
    });
  }
}
