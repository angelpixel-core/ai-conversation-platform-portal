import { Tenant } from './Tenant';
import { TenantTier } from './TenantTier';

export interface CreateTenantInput {
  id: string;
  name: string;
  tier: TenantTier;
  initialBudgetUsd?: string;
}

export interface TenantGatewayPort {
  getTenants(): Promise<Tenant[]>;
  createTenant(input: CreateTenantInput): Promise<Tenant>;
}
