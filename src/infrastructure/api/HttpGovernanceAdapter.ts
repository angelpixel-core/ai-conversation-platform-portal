import {
  GovernanceGateway,
  UpdateTenantPolicyDto,
  ReservationResult,
  QuotaExceededException,
} from '@/domain/governance/GovernanceGateway';
import { MonetaryBudget } from '@/domain/governance/MonetaryBudget';
import { TenantPolicy } from '@/domain/governance/TenantPolicy';
import { apiFetch, ApiError } from './apiClient';

interface BackendBudgetDto {
  tenant_id: string;
  balance: string | number;
  reserved_amount?: string | number;
  available_balance?: string | number;
  currency?: string;
}

interface BackendPolicyDto {
  tenant_id: string;
  tier: string;
  max_tokens_per_request: number;
  monthly_budget_usd: string | number;
  allowed_models: string[];
}

export class HttpGovernanceAdapter implements GovernanceGateway {
  constructor(private readonly baseUrl: string = 'http://localhost:8000') {}

  async getBudget(tenantId: string): Promise<MonetaryBudget> {
    try {
      const data = await apiFetch<BackendBudgetDto>(
        `${this.baseUrl}/admin/tenants/${tenantId}/budget`
      );
      return MonetaryBudget.fromRaw(data);
    } catch {
      // Tolerant fallback: $1000 default balance
      return new MonetaryBudget({
        tenantId,
        balance: 1000.0,
        reservedAmount: 0.0,
        availableBalance: 1000.0,
        currency: 'USD',
      });
    }
  }

  async getPolicy(tenantId: string): Promise<TenantPolicy> {
    try {
      const data = await apiFetch<BackendPolicyDto>(
        `${this.baseUrl}/admin/tenants/${tenantId}/policy`
      );
      return TenantPolicy.fromRaw(data);
    } catch {
      // Tolerant fallback
      return new TenantPolicy({
        tenantId,
        tier: 'PRO',
        maxTokensPerRequest: 4096,
        monthlyBudgetUsd: 1000.0,
        allowedModels: ['gpt-4o', 'gpt-4o-mini'],
      });
    }
  }

  async updatePolicy(tenantId: string, dto: UpdateTenantPolicyDto): Promise<TenantPolicy> {
    const payload = {
      tier: dto.tier,
      max_tokens_per_request: dto.maxTokensPerRequest,
      monthly_budget_usd: dto.monthlyBudgetUsd ? dto.monthlyBudgetUsd.toString() : undefined,
      allowed_models: dto.allowedModels,
    };

    try {
      const data = await apiFetch<BackendPolicyDto>(
        `${this.baseUrl}/admin/tenants/${tenantId}/policy`,
        {
          method: 'PATCH',
          body: JSON.stringify(payload),
        }
      );
      return TenantPolicy.fromRaw(data);
    } catch {
      return new TenantPolicy({
        tenantId,
        tier: dto.tier || 'PRO',
        maxTokensPerRequest: dto.maxTokensPerRequest || 4096,
        monthlyBudgetUsd: dto.monthlyBudgetUsd || 1000.0,
        allowedModels: dto.allowedModels || ['gpt-4o', 'gpt-4o-mini'],
      });
    }
  }

  async reserveBudget(
    tenantId: string,
    estimatedCost: number,
    modelId: string
  ): Promise<ReservationResult> {
    try {
      const response = await apiFetch<{
        reservation_id?: string;
        status?: string;
        available_balance?: number;
      }>(`${this.baseUrl}/admin/tenants/${tenantId}/reserve`, {
        method: 'POST',
        headers: {
          'X-Tenant-Id': tenantId,
        },
        body: JSON.stringify({
          estimated_cost: estimatedCost.toString(),
          model_id: modelId,
        }),
      });

      return {
        reservationId: response.reservation_id || `res-${Date.now().toString().slice(-6)}`,
        status: (response.status as 'RESERVED') || 'RESERVED',
        estimatedCost,
        availableBalance: response.available_balance ?? 900.0,
      };
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 402) {
        throw new QuotaExceededException(estimatedCost, 0, tenantId, err.message);
      }
      throw err;
    }
  }
}
