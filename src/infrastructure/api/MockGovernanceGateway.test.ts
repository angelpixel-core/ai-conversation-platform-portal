import { describe, it, expect, beforeEach } from 'vitest';
import { MockGovernanceGateway } from './MockGovernanceGateway';
import { QuotaExceededException } from '@/domain/governance/GovernanceGateway';

describe('MockGovernanceGateway', () => {
  let gateway: MockGovernanceGateway;

  beforeEach(() => {
    gateway = new MockGovernanceGateway();
  });

  it('fetches initial budget and policy for corp-acme', async () => {
    const budget = await gateway.getBudget('corp-acme');
    expect(budget.balance).toBe(1000);
    expect(budget.availableBalance).toBe(850);
    expect(budget.reservedAmount).toBe(150);

    const policy = await gateway.getPolicy('corp-acme');
    expect(policy.tier).toBe('ENTERPRISE');
    expect(policy.maxTokensPerRequest).toBe(8192);
    expect(policy.allowedModels).toContain('gpt-4o');
  });

  it('updates policy correctly', async () => {
    const updated = await gateway.updatePolicy('corp-acme', {
      tier: 'PRO',
      maxTokensPerRequest: 16384,
      allowedModels: ['gpt-4o', 'claude-3-5-sonnet'],
    });

    expect(updated.tier).toBe('PRO');
    expect(updated.maxTokensPerRequest).toBe(16384);
    expect(updated.allowedModels).toEqual(['gpt-4o', 'claude-3-5-sonnet']);

    // verify persistence
    const reFetched = await gateway.getPolicy('corp-acme');
    expect(reFetched.maxTokensPerRequest).toBe(16384);
  });

  it('reserves budget when available balance is sufficient', async () => {
    const result = await gateway.reserveBudget('corp-acme', 50, 'gpt-4o');
    expect(result.status).toBe('RESERVED');
    expect(result.estimatedCost).toBe(50);
    expect(result.availableBalance).toBe(800);

    const newBudget = await gateway.getBudget('corp-acme');
    expect(newBudget.availableBalance).toBe(800);
    expect(newBudget.reservedAmount).toBe(200);
  });

  it('throws QuotaExceededException when requested cost exceeds available balance (HTTP 402 simulation)', async () => {
    await expect(gateway.reserveBudget('corp-acme', 99999, 'gpt-4o')).rejects.toThrow(
      QuotaExceededException
    );
  });
});
