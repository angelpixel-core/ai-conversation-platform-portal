import { useQuery } from '@tanstack/react-query';
import { container } from '@/infrastructure/container';
import { SystemHealth } from '@/domain/health/SystemHealth';

export const HEALTH_QUERY_KEY = ['system-health'] as const;

export interface UseSystemHealthOptions {
  refetchInterval?: number | false;
  enabled?: boolean;
}

export function useSystemHealth(options?: UseSystemHealthOptions) {
  const { refetchInterval = 10000, enabled = true } = options || {};

  return useQuery<SystemHealth>({
    queryKey: HEALTH_QUERY_KEY,
    queryFn: () => container.healthGateway.getHealth(),
    refetchInterval,
    enabled,
    staleTime: 5000,
  });
}
