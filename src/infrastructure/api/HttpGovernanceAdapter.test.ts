import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpGovernanceAdapter } from './HttpGovernanceAdapter';
import { QuotaExceededException } from '@/domain/governance/GovernanceGateway';

describe('HttpGovernanceAdapter', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('fetches budget and parses response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        tenant_id: 'corp-acme',
        balance: '1500.0000',
        reserved_amount: '300.0000',
        available_balance: '1200.0000',
        currency: 'USD',
      }),
    });

    const adapter = new HttpGovernanceAdapter('http://localhost:8000');
    const budget = await adapter.getBudget('corp-acme');

    expect(budget.tenantId).toBe('corp-acme');
    expect(budget.balance).toBe(1500);
    expect(budget.reservedAmount).toBe(300);
    expect(budget.availableBalance).toBe(1200);
    expect(budget.usagePercentage).toBe(20);
  });

  it('throws QuotaExceededException when backend responds with 402 Payment Required', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 402,
      json: async () => ({
        detail: 'Presupuesto insuficiente o cuota excedida para el tenant',
      }),
    });

    const adapter = new HttpGovernanceAdapter('http://localhost:8000');
    await expect(adapter.reserveBudget('corp-acme', 50000, 'gpt-4o')).rejects.toThrow(
      QuotaExceededException
    );
  });
});
