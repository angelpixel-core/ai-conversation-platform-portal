'use client';

import { useState, useCallback, useEffect } from 'react';
import { MonetaryBudget } from '@/domain/governance/MonetaryBudget';
import { TenantPolicy } from '@/domain/governance/TenantPolicy';
import {
  GovernanceGateway,
  UpdateTenantPolicyDto,
  ReservationResult,
  QuotaExceededException,
} from '@/domain/governance/GovernanceGateway';
import { MockGovernanceGateway } from '@/infrastructure/api/MockGovernanceGateway';
import { HttpGovernanceAdapter } from '@/infrastructure/api/HttpGovernanceAdapter';

const defaultGateway: GovernanceGateway =
  process.env.NEXT_PUBLIC_USE_MOCKS === 'true'
    ? new MockGovernanceGateway()
    : new HttpGovernanceAdapter();

export interface UseTenantGovernanceOptions {
  tenantId: string;
  gateway?: GovernanceGateway;
}

export function useTenantGovernance({
  tenantId,
  gateway = defaultGateway,
}: UseTenantGovernanceOptions) {
  const [budget, setBudget] = useState<MonetaryBudget | null>(null);
  const [policy, setPolicy] = useState<TenantPolicy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);
  const [isReserving, setIsReserving] = useState(false);
  const [quotaExceededError, setQuotaExceededError] = useState<{
    requestedCost: number;
    availableBalance: number;
    message: string;
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!tenantId) return;
    setIsLoading(true);
    try {
      const [fetchedBudget, fetchedPolicy] = await Promise.all([
        gateway.getBudget(tenantId),
        gateway.getPolicy(tenantId),
      ]);
      setBudget(fetchedBudget);
      setPolicy(fetchedPolicy);
    } catch {
      // Keep existing state or fallback gracefully
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, gateway]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const updatePolicy = useCallback(
    async (dto: UpdateTenantPolicyDto): Promise<TenantPolicy | null> => {
      setIsSavingPolicy(true);
      setSuccessMessage(null);
      try {
        const updated = await gateway.updatePolicy(tenantId, dto);
        setPolicy(updated);
        setSuccessMessage('Política de tenant actualizada con éxito');
        return updated;
      } catch (err: unknown) {
        console.error('Failed to update tenant policy', err);
        return null;
      } finally {
        setIsSavingPolicy(false);
      }
    },
    [tenantId, gateway]
  );

  const reserveBudget = useCallback(
    async (estimatedCost: number, modelId: string): Promise<ReservationResult | null> => {
      setIsReserving(true);
      setQuotaExceededError(null);
      try {
        const result = await gateway.reserveBudget(tenantId, estimatedCost, modelId);
        // Refresh budget after reservation
        const newBudget = await gateway.getBudget(tenantId);
        setBudget(newBudget);
        return result;
      } catch (err: unknown) {
        if (err instanceof QuotaExceededException) {
          setQuotaExceededError({
            requestedCost: err.requestedCost,
            availableBalance: err.availableBalance,
            message: err.message,
          });
        } else {
          setQuotaExceededError({
            requestedCost: estimatedCost,
            availableBalance: budget ? budget.availableBalance : 0,
            message: 'Error al reservar cuota de tokens',
          });
        }
        return null;
      } finally {
        setIsReserving(false);
      }
    },
    [tenantId, gateway, budget]
  );

  const clearQuotaError = useCallback(() => {
    setQuotaExceededError(null);
  }, []);

  const clearSuccessMessage = useCallback(() => {
    setSuccessMessage(null);
  }, []);

  return {
    budget,
    policy,
    isLoading,
    isSavingPolicy,
    isReserving,
    quotaExceededError,
    successMessage,
    clearQuotaError,
    clearSuccessMessage,
    updatePolicy,
    reserveBudget,
    refetch: fetchAll,
  };
}
