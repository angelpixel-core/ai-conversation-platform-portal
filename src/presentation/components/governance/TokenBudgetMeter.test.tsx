import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { TokenBudgetMeter } from './TokenBudgetMeter';
import { MonetaryBudget } from '@/domain/governance/MonetaryBudget';

describe('TokenBudgetMeter Component', () => {
  it('renders loading state when isLoading is true or budget is null', () => {
    const { container } = render(<TokenBudgetMeter budget={null} isLoading={true} />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders budget numbers, tenant id, and healthy status badge', () => {
    const budget = new MonetaryBudget({
      tenantId: 'corp-acme',
      balance: 1000,
      reservedAmount: 150,
      availableBalance: 850,
      currency: 'USD',
    });

    render(<TokenBudgetMeter budget={budget} />);

    expect(screen.getByText(/Presupuesto de Tokens/i)).toBeInTheDocument();
    expect(screen.getByText('corp-acme')).toBeInTheDocument();
    expect(screen.getByText('$1000.00')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument();
    expect(screen.getByText('$850.00')).toBeInTheDocument();
    expect(screen.getByText(/SALDO SALUDABLE/i)).toBeInTheDocument();
  });

  it('renders low budget warning when available balance is below 15%', () => {
    const budget = new MonetaryBudget({
      tenantId: 'globex-ind',
      balance: 1000,
      reservedAmount: 900,
      availableBalance: 100,
    });

    render(<TokenBudgetMeter budget={budget} />);
    expect(screen.getByText(/SALDO BAJO/i)).toBeInTheDocument();
  });

  it('renders quota exhausted alert when available balance is 0', () => {
    const budget = new MonetaryBudget({
      tenantId: 'initech-llc',
      balance: 1000,
      reservedAmount: 1000,
      availableBalance: 0,
    });

    render(<TokenBudgetMeter budget={budget} />);
    expect(screen.getByText(/CUOTA AGOTADA/i)).toBeInTheDocument();
  });
});
