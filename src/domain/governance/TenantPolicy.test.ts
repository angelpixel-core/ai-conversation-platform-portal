import { describe, it, expect } from 'vitest';
import { TenantPolicy } from './TenantPolicy';

describe('TenantPolicy Domain Entity', () => {
  it('instantiates and checks allowed models', () => {
    const policy = new TenantPolicy({
      tenantId: 'corp-acme',
      tier: 'ENTERPRISE',
      maxTokensPerRequest: 8192,
      monthlyBudgetUsd: 2500,
      allowedModels: ['gpt-4o', 'claude-3-5-sonnet'],
    });

    expect(policy.tenantId).toBe('corp-acme');
    expect(policy.tier).toBe('ENTERPRISE');
    expect(policy.maxTokensPerRequest).toBe(8192);
    expect(policy.monthlyBudgetUsd).toBe(2500);
    expect(policy.isModelAllowed('gpt-4o')).toBe(true);
    expect(policy.isModelAllowed('claude-3-5-sonnet')).toBe(true);
    expect(policy.isModelAllowed('llama-3')).toBe(false);
  });

  it('tolerantly parses raw API response', () => {
    const fromRaw = TenantPolicy.fromRaw({
      tenant_id: 'corp-acme',
      tier: 'enterprise',
      max_tokens_per_request: '16384',
      monthly_budget_usd: '5000.0000',
      allowed_models: ['gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet'],
    });

    expect(fromRaw.tier).toBe('ENTERPRISE');
    expect(fromRaw.maxTokensPerRequest).toBe(16384);
    expect(fromRaw.monthlyBudgetUsd).toBe(5000);
    expect(fromRaw.allowedModels).toHaveLength(3);
  });
});
