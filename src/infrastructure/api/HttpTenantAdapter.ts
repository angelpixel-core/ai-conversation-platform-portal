import { TenantGatewayPort, CreateTenantInput } from '@/domain/tenants/TenantGatewayPort';
import { Tenant } from '@/domain/tenants/Tenant';
import { TenantId } from '@/domain/tenants/TenantId';
import { TenantTier } from '@/domain/tenants/TenantTier';

interface RawTenantResponse {
  id?: string;
  tenant_id?: string;
  name: string;
  tier?: string;
  created_at?: string;
}

export class HttpTenantAdapter implements TenantGatewayPort {
  constructor(private readonly baseUrl: string = 'http://localhost:8000') {}

  async getTenants(): Promise<Tenant[]> {
    const response = await fetch(`${this.baseUrl}/admin/tenants`, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error fetching tenants: HTTP ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as RawTenantResponse[];
    return data.map((raw) => {
      const rawId = raw.id || raw.tenant_id || 'default';
      const tier = (raw.tier?.toUpperCase() as TenantTier) || 'PRO';
      const createdAt = raw.created_at ? new Date(raw.created_at) : new Date();
      return new Tenant(TenantId.create(rawId), raw.name, tier, createdAt);
    });
  }

  async createTenant(input: CreateTenantInput): Promise<Tenant> {
    const response = await fetch(`${this.baseUrl}/admin/tenants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        tenant_id: input.id,
        name: input.name,
        tier: input.tier,
        initial_budget_usd: input.initialBudgetUsd,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error creating tenant: HTTP ${response.status} ${response.statusText}`);
    }

    const raw = (await response.json()) as RawTenantResponse;
    const rawId = raw.id || raw.tenant_id || input.id;
    const tier = (raw.tier?.toUpperCase() as TenantTier) || input.tier;
    const createdAt = raw.created_at ? new Date(raw.created_at) : new Date();

    return new Tenant(TenantId.create(rawId), raw.name, tier, createdAt);
  }
}
