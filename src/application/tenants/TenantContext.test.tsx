import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { TenantProvider, useTenant } from './TenantContext';
import { container } from '@/infrastructure/container';
import { Tenant } from '@/domain/tenants/Tenant';
import { TenantId } from '@/domain/tenants/TenantId';
import { tenantSessionStore } from '@/infrastructure/storage/tenantSessionStore';

describe('TenantContext and useTenant', () => {
  let queryClient: QueryClient;
  const mockTenants = [
    new Tenant(TenantId.create('corp-acme'), 'Acme Corporation', 'ENTERPRISE'),
    new Tenant(TenantId.create('corp-globex'), 'Globex Industries', 'PRO'),
  ];

  beforeEach(() => {
    tenantSessionStore.clear();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.spyOn(container.tenantGateway, 'getTenants').mockResolvedValue(mockTenants);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <TenantProvider>{children}</TenantProvider>
    </QueryClientProvider>
  );

  it('initializes with the first available tenant if none in session store', async () => {
    const { result } = renderHook(() => useTenant(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.activeTenant?.id.value).toBe('corp-acme');
    expect(tenantSessionStore.getActiveTenantId()?.value).toBe('corp-acme');
  });

  it('restores stored tenant from session store if present', async () => {
    tenantSessionStore.setActiveTenantId(TenantId.create('corp-globex'));

    const { result } = renderHook(() => useTenant(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.activeTenant?.id.value).toBe('corp-globex');
  });

  it('switches tenant and updates storage without guard when hasActiveConversation is false', async () => {
    const { result } = renderHook(() => useTenant(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.requestSwitchTenant(mockTenants[1], false);
    });

    expect(result.current.activeTenant?.id.value).toBe('corp-globex');
    expect(result.current.isSwitchGuardOpen).toBe(false);
  });

  it('triggers guard modal when switching tenant with an active conversation', async () => {
    const { result } = renderHook(() => useTenant(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.requestSwitchTenant(mockTenants[1], true);
    });

    // Guard should open, active tenant should NOT have changed yet
    expect(result.current.isSwitchGuardOpen).toBe(true);
    expect(result.current.pendingTenant?.id.value).toBe('corp-globex');
    expect(result.current.activeTenant?.id.value).toBe('corp-acme');

    // Confirm switch
    const onReset = vi.fn();
    act(() => {
      result.current.confirmSwitchTenant(onReset);
    });

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(result.current.activeTenant?.id.value).toBe('corp-globex');
    expect(result.current.isSwitchGuardOpen).toBe(false);
  });
});
