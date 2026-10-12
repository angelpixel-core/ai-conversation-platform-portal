import {
  GovernanceGateway,
  UpdateTenantPolicyDto,
  ReservationResult,
  QuotaExceededException,
} from '@/domain/governance/GovernanceGateway';
import { MonetaryBudget } from '@/domain/governance/MonetaryBudget';
import { TenantPolicy, TenantTier } from '@/domain/governance/TenantPolicy';

interface MockTenantState {
  balance: number;
  reservedAmount: number;
  availableBalance: number;
  currency: string;
  policy: {
    tier: TenantTier;
    maxTokensPerRequest: number;
    monthlyBudgetUsd: number;
    allowedModels: string[];
  };
}

const DEFAULT_STATE: Record<string, MockTenantState> = {
  'corp-acme': {
    balance: 1000.0,
    reservedAmount: 150.0,
    availableBalance: 850.0,
    currency: 'USD',
    policy: {
      tier: 'ENTERPRISE',
      maxTokensPerRequest: 8192,
      monthlyBudgetUsd: 2500.0,
      allowedModels: ['gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet'],
    },
  },
  'globex-ind': {
    balance: 500.0,
    reservedAmount: 450.0,
    availableBalance: 50.0, // Low budget < 15%
    currency: 'USD',
    policy: {
      tier: 'PRO',
      maxTokensPerRequest: 4096,
      monthlyBudgetUsd: 500.0,
      allowedModels: ['gpt-4o-mini'],
    },
  },
  'initech-llc': {
    balance: 100.0,
    reservedAmount: 100.0,
    availableBalance: 0.0, // Exhausted
    currency: 'USD',
    policy: {
      tier: 'FREE',
      maxTokensPerRequest: 2048,
      monthlyBudgetUsd: 100.0,
      allowedModels: ['gpt-4o-mini'],
    },
  },
};

export class MockGovernanceGateway implements GovernanceGateway {
  private states: Map<string, MockTenantState>;

  constructor(initialStates?: Record<string, MockTenantState>) {
    this.states = new Map();
    const source = initialStates || DEFAULT_STATE;
    for (const [k, v] of Object.entries(source)) {
      this.states.set(k, { ...v, policy: { ...v.policy, allowedModels: [...v.policy.allowedModels] } });
    }
  }

  private getState(tenantId: string): MockTenantState {
    const existing = this.states.get(tenantId);
    if (existing) return existing;

    const defaultCreated: MockTenantState = {
      balance: 1000.0,
      reservedAmount: 0.0,
      availableBalance: 1000.0,
      currency: 'USD',
      policy: {
        tier: 'PRO',
        maxTokensPerRequest: 4096,
        monthlyBudgetUsd: 1000.0,
        allowedModels: ['gpt-4o', 'gpt-4o-mini'],
      },
    };
    this.states.set(tenantId, defaultCreated);
    return defaultCreated;
  }

  async getBudget(tenantId: string): Promise<MonetaryBudget> {
    const s = this.getState(tenantId);
    return new MonetaryBudget({
      tenantId,
      balance: s.balance,
      reservedAmount: s.reservedAmount,
      availableBalance: s.availableBalance,
      currency: s.currency,
    });
  }

  async getPolicy(tenantId: string): Promise<TenantPolicy> {
    const s = this.getState(tenantId);
    return new TenantPolicy({
      tenantId,
      tier: s.policy.tier,
      maxTokensPerRequest: s.policy.maxTokensPerRequest,
      monthlyBudgetUsd: s.policy.monthlyBudgetUsd,
      allowedModels: s.policy.allowedModels,
    });
  }

  async updatePolicy(tenantId: string, dto: UpdateTenantPolicyDto): Promise<TenantPolicy> {
    const s = this.getState(tenantId);
    if (dto.tier) s.policy.tier = dto.tier;
    if (dto.maxTokensPerRequest !== undefined) s.policy.maxTokensPerRequest = dto.maxTokensPerRequest;
    if (dto.monthlyBudgetUsd !== undefined) s.policy.monthlyBudgetUsd = dto.monthlyBudgetUsd;
    if (dto.allowedModels !== undefined) s.policy.allowedModels = [...dto.allowedModels];

    return new TenantPolicy({
      tenantId,
      tier: s.policy.tier,
      maxTokensPerRequest: s.policy.maxTokensPerRequest,
      monthlyBudgetUsd: s.policy.monthlyBudgetUsd,
      allowedModels: s.policy.allowedModels,
    });
  }

  async reserveBudget(
    tenantId: string,
    estimatedCost: number,
    _modelId: string
  ): Promise<ReservationResult> {
    const s = this.getState(tenantId);
    if (estimatedCost > s.availableBalance) {
      throw new QuotaExceededException(estimatedCost, s.availableBalance, tenantId);
    }

    s.reservedAmount += estimatedCost;
    s.availableBalance -= estimatedCost;

    return {
      reservationId: `res-${Date.now().toString().slice(-6)}`,
      status: 'RESERVED',
      estimatedCost,
      availableBalance: s.availableBalance,
    };
  }

  reset(): void {
    this.states.clear();
    for (const [k, v] of Object.entries(DEFAULT_STATE)) {
      this.states.set(k, { ...v, policy: { ...v.policy, allowedModels: [...v.policy.allowedModels] } });
    }
  }
}
