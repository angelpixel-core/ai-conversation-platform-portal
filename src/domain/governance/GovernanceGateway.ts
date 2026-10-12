import { MonetaryBudget } from './MonetaryBudget';
import { TenantPolicy, TenantTier } from './TenantPolicy';

export interface UpdateTenantPolicyDto {
  tier?: TenantTier;
  maxTokensPerRequest?: number;
  monthlyBudgetUsd?: number;
  allowedModels?: string[];
}

export interface ReservationResult {
  reservationId: string;
  status: 'RESERVED' | 'CONFIRMED' | 'REJECTED';
  estimatedCost: number;
  availableBalance: number;
}

export class QuotaExceededException extends Error {
  constructor(
    public readonly requestedCost: number,
    public readonly availableBalance: number,
    public readonly tenantId: string,
    message?: string
  ) {
    super(
      message ||
        `Presupuesto insuficiente o cuota excedida para el tenant '${tenantId}'. Solicitado: $${requestedCost.toFixed(
          2
        )}, Disponible: $${availableBalance.toFixed(2)}`
    );
    this.name = 'QuotaExceededException';
  }
}

export interface GovernanceGateway {
  getBudget(tenantId: string): Promise<MonetaryBudget>;
  getPolicy(tenantId: string): Promise<TenantPolicy>;
  updatePolicy(tenantId: string, dto: UpdateTenantPolicyDto): Promise<TenantPolicy>;
  reserveBudget(tenantId: string, estimatedCost: number, modelId: string): Promise<ReservationResult>;
}
