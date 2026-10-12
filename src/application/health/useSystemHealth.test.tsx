import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import { useSystemHealth } from './useSystemHealth';
import { container } from '@/infrastructure/container';
import { SystemHealth } from '@/domain/health/SystemHealth';

describe('useSystemHealth hook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('fetches system health from container gateway and returns data', async () => {
    const mockHealth = new SystemHealth('HEALTHY', 15, new Date());
    vi.spyOn(container.healthGateway, 'getHealth').mockResolvedValue(mockHealth);

    const { result } = renderHook(() => useSystemHealth({ refetchInterval: false }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.status).toBe('HEALTHY');
    expect(result.current.data?.latencyMs).toBe(15);
  });
});
