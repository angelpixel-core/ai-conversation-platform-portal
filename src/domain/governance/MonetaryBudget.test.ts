import { describe, it, expect } from 'vitest';
import { MonetaryBudget } from './MonetaryBudget';

describe('MonetaryBudget Value Object', () => {
  it('instantiates correctly and calculates usage percentage', () => {
    const budget = new MonetaryBudget({
      tenantId: 'corp-acme',
      balance: 1000,
      reservedAmount: 250,
      availableBalance: 750,
      currency: 'USD',
    });

    expect(budget.tenantId).toBe('corp-acme');
    expect(budget.balance).toBe(1000);
    expect(budget.reservedAmount).toBe(250);
    expect(budget.availableBalance).toBe(750);
    expect(budget.usagePercentage).toBe(25);
    expect(budget.isLowBudget).toBe(false);
    expect(budget.isExhausted).toBe(false);
  });

  it('detects isLowBudget when available balance is below 15%', () => {
    const lowBudget = new MonetaryBudget({
      tenantId: 'corp-acme',
      balance: 1000,
      reservedAmount: 900,
      availableBalance: 100, // 10%
    });

    expect(lowBudget.isLowBudget).toBe(true);
    expect(lowBudget.isExhausted).toBe(false);
  });

  it('detects isExhausted when available balance is 0 or negative', () => {
    const exhaustedBudget = new MonetaryBudget({
      tenantId: 'corp-acme',
      balance: 1000,
      reservedAmount: 1000,
      availableBalance: 0,
    });

    expect(exhaustedBudget.isExhausted).toBe(true);
    expect(exhaustedBudget.isLowBudget).toBe(false);
  });

  it('handles tolerant parsing from raw API strings', () => {
    const fromRaw = MonetaryBudget.fromRaw({
      tenant_id: 'corp-acme',
      balance: '2500.0000',
      reserved_amount: '500.0000',
      available_balance: '2000.0000',
      currency: 'USD',
    });

    expect(fromRaw.balance).toBe(2500);
    expect(fromRaw.reservedAmount).toBe(500);
    expect(fromRaw.availableBalance).toBe(2000);
    expect(fromRaw.usagePercentage).toBe(20);
  });

  it('throws an error if tenantId is empty', () => {
    expect(() => {
      new MonetaryBudget({
        tenantId: '',
        balance: 100,
        reservedAmount: 0,
        availableBalance: 100,
      });
    }).toThrow('Tenant ID cannot be empty');
  });
});
