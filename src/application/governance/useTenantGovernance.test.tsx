import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTenantGovernance } from './useTenantGovernance';
import { MockGovernanceGateway } from '@/infrastructure/api/MockGovernanceGateway';

describe('useTenantGovernance', () => {
  let gateway: MockGovernanceGateway;

  beforeEach(() => {
    gateway = new MockGovernanceGateway();
  });

  it('loads budget and policy for the specified tenant', async () => {
    const { result } = renderHook(() =>
      useTenantGovernance({ tenantId: 'corp-acme', gateway })
    );

    // Initial state loading
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.budget).not.toBeNull();
    expect(result.current.budget?.balance).toBe(1000);
    expect(result.current.policy).not.toBeNull();
    expect(result.current.policy?.tier).toBe('ENTERPRISE');
  });

  it('updates policy and sets success message', async () => {
    const { result } = renderHook(() =>
      useTenantGovernance({ tenantId: 'corp-acme', gateway })
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    await act(async () => {
      await result.current.updatePolicy({
        tier: 'PRO',
        maxTokensPerRequest: 16384,
      });
    });

    expect(result.current.policy?.tier).toBe('PRO');
    expect(result.current.policy?.maxTokensPerRequest).toBe(16384);
    expect(result.current.successMessage).toBe('Política de tenant actualizada con éxito');
  });

  it('handles reservation failure when budget is exceeded and sets quotaExceededError', async () => {
    const { result } = renderHook(() =>
      useTenantGovernance({ tenantId: 'corp-acme', gateway })
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    await act(async () => {
      await result.current.reserveBudget(99999, 'gpt-4o');
    });

    expect(result.current.quotaExceededError).not.toBeNull();
    expect(result.current.quotaExceededError?.requestedCost).toBe(99999);
    expect(result.current.quotaExceededError?.message).toContain('Presupuesto insuficiente');
  });
});
