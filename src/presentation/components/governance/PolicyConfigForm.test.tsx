import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { PolicyConfigForm } from './PolicyConfigForm';
import { TenantPolicy } from '@/domain/governance/TenantPolicy';

describe('PolicyConfigForm Component', () => {
  const samplePolicy = new TenantPolicy({
    tenantId: 'corp-acme',
    tier: 'ENTERPRISE',
    maxTokensPerRequest: 8192,
    monthlyBudgetUsd: 2500,
    allowedModels: ['gpt-4o', 'claude-3-5-sonnet'],
  });

  it('renders form with policy fields, tiers, and allowed models', () => {
    render(<PolicyConfigForm policy={samplePolicy} onSave={vi.fn()} />);

    expect(screen.getByText(/Políticas del Tenant/i)).toBeInTheDocument();
    expect(screen.getByText(/Enterprise VIP/i)).toBeInTheDocument();
    expect(screen.getByText(/8,192 tokens/i)).toBeInTheDocument();
    expect(screen.getByText('gpt-4o')).toBeInTheDocument();
    expect(screen.getByText('claude-3-5-sonnet')).toBeInTheDocument();
  });

  it('triggers onSave with updated parameters when submitted', () => {
    const onSave = vi.fn().mockResolvedValue({});
    render(<PolicyConfigForm policy={samplePolicy} onSave={onSave} />);

    // Click on Pro Business tier
    const proBtn = screen.getByRole('button', { name: /Pro Business/i });
    fireEvent.click(proBtn);

    // Click Save button
    const submitBtn = screen.getByRole('button', { name: /Guardar Cambios de Política/i });
    fireEvent.click(submitBtn);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        tier: 'PRO',
        maxTokensPerRequest: 8192,
        monthlyBudgetUsd: 2500,
      })
    );
  });

  it('renders success notification when successMessage is passed', () => {
    render(
      <PolicyConfigForm
        policy={samplePolicy}
        successMessage="Política de tenant actualizada con éxito"
        onSave={vi.fn()}
      />
    );

    expect(screen.getByRole('status')).toHaveTextContent(/Política de tenant actualizada con éxito/i);
  });
});
