import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { DashboardHeader } from './DashboardHeader';
import { TenantProvider } from '@/application/tenants/TenantContext';
import { container } from '@/infrastructure/container';
import { SystemHealth } from '@/domain/health/SystemHealth';
import { Tenant } from '@/domain/tenants/Tenant';
import { TenantId } from '@/domain/tenants/TenantId';

describe('DashboardHeader', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.restoreAllMocks();
    vi.spyOn(container.tenantGateway, 'getTenants').mockResolvedValue([
      new Tenant(TenantId.create('corp-acme'), 'Acme Corporation', 'ENTERPRISE'),
    ]);
  });

  const renderWithClient = (ui: React.ReactElement) =>
    render(
      <QueryClientProvider client={queryClient}>
        <TenantProvider>{ui}</TenantProvider>
      </QueryClientProvider>
    );

  it('renders brand title, tenant selector, and status pill', async () => {
    vi.spyOn(container.healthGateway, 'getHealth').mockResolvedValue(
      new SystemHealth('HEALTHY', 25, new Date())
    );

    renderWithClient(<DashboardHeader />);

    expect(screen.getByText(/COFFEE CHATBOT/i)).toBeInTheDocument();
    expect(await screen.findByText(/Acme Corporation/i)).toBeInTheDocument();
    expect(await screen.findByText(/SISTEMA ONLINE/i)).toBeInTheDocument();
  });

  it('opens SystemStatusModal when clicking the status pill', async () => {
    vi.spyOn(container.healthGateway, 'getHealth').mockResolvedValue(
      new SystemHealth('HEALTHY', 25, new Date(), [
        { name: 'api', status: 'HEALTHY', latencyMs: 25 },
      ])
    );
    const user = userEvent.setup();

    renderWithClient(<DashboardHeader />);

    const pill = await screen.findByRole('button', { name: /Estado del sistema/i });
    await user.click(pill);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Diagnóstico del Sistema/i)).toBeInTheDocument();
  });

  it('toggles mode when clicking the mode toggle button', async () => {
    vi.spyOn(container.healthGateway, 'getHealth').mockResolvedValue(
      new SystemHealth('HEALTHY', 25, new Date())
    );
    const user = userEvent.setup();

    renderWithClient(<DashboardHeader />);

    const modeBtn = await screen.findByRole('button', { name: /Modo de ejecución/i });
    expect(modeBtn).toBeInTheDocument();
    await user.click(modeBtn);

    const updatedModeBtn = await screen.findByRole('button', { name: /Modo de ejecución/i });
    expect(updatedModeBtn).toBeInTheDocument();
  });
});

