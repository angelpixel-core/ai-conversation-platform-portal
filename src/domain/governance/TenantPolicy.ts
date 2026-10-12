export type TenantTier = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface TenantPolicyProps {
  tenantId: string;
  tier: TenantTier;
  maxTokensPerRequest: number;
  monthlyBudgetUsd: number;
  allowedModels: string[];
}

export class TenantPolicy {
  public readonly tenantId: string;
  public readonly tier: TenantTier;
  public readonly maxTokensPerRequest: number;
  public readonly monthlyBudgetUsd: number;
  public readonly allowedModels: string[];

  constructor(props: TenantPolicyProps) {
    if (!props.tenantId || props.tenantId.trim() === '') {
      throw new Error('Tenant ID cannot be empty');
    }
    this.tenantId = props.tenantId;
    this.tier = props.tier;
    this.maxTokensPerRequest = Math.max(128, props.maxTokensPerRequest);
    this.monthlyBudgetUsd = Math.max(0, props.monthlyBudgetUsd);
    this.allowedModels = props.allowedModels.length > 0 ? props.allowedModels : ['gpt-4o-mini'];
  }

  isModelAllowed(modelId: string): boolean {
    return this.allowedModels.includes(modelId);
  }

  static fromRaw(raw: {
    tenant_id?: string;
    tenantId?: string;
    tier?: string;
    max_tokens_per_request?: number | string;
    maxTokensPerRequest?: number | string;
    monthly_budget_usd?: number | string;
    monthlyBudgetUsd?: number | string;
    allowed_models?: string[];
    allowedModels?: string[];
  }): TenantPolicy {
    const parseNum = (val: string | number | undefined, defaultVal = 0): number => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? defaultVal : parsed;
      }
      return defaultVal;
    };

    let tier: TenantTier = 'PRO';
    const tierRaw = (raw.tier || '').toUpperCase();
    if (tierRaw === 'FREE' || tierRaw === 'PRO' || tierRaw === 'ENTERPRISE') {
      tier = tierRaw as TenantTier;
    }

    return new TenantPolicy({
      tenantId: raw.tenant_id || raw.tenantId || 'unknown-tenant',
      tier,
      maxTokensPerRequest: parseNum(raw.max_tokens_per_request ?? raw.maxTokensPerRequest, 4096),
      monthlyBudgetUsd: parseNum(raw.monthly_budget_usd ?? raw.monthlyBudgetUsd, 1000),
      allowedModels: raw.allowed_models || raw.allowedModels || ['gpt-4o', 'gpt-4o-mini'],
    });
  }
}
