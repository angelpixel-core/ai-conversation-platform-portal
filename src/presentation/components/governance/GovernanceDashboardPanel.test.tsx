import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { GovernanceDashboardPanel } from './GovernanceDashboardPanel';
import { TenantProvider } from '@/application/tenants/TenantContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <TenantProvider>{ui}</TenantProvider>
    </QueryClientProvider>
  );
}

describe('GovernanceDashboardPanel Component', () => {
  it('renders top header, meter, and policy configuration sections', async () => {
    renderWithProviders(<GovernanceDashboardPanel />);

    expect(screen.getByText(/Gobernanza de Tokens & Presupuestos/i)).toBeInTheDocument();
    expect(screen.getByText(/CU-05 STEP 5/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Simular Inferencia \(\$0\.50\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Simular Exceso \(HTTP 402\)/i })).toBeInTheDocument();
  });

  it('triggers HTTP 402 simulation and displays QuotaExceededModal', async () => {
    renderWithProviders(<GovernanceDashboardPanel />);

    const exceedBtn = screen.getByRole('button', { name: /Simular Exceso \(HTTP 402\)/i });
    await act(async () => {
      fireEvent.click(exceedBtn);
    });

    // Modal dialog appears
    const modal = await screen.findByRole('dialog');
    expect(modal).toBeInTheDocument();
    expect(screen.getByText(/HTTP 402 PAYMENT REQUIRED/i)).toBeInTheDocument();
    expect(screen.getByText(/Cuota de Tokens Excedida/i)).toBeInTheDocument();
  });
});
