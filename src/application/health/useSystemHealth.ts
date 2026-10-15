import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, useTransition } from 'react';
import { container } from '@/infrastructure/container';
import { SystemHealth, HealthMode } from '@/domain/health/SystemHealth';
import { runtimeEnvironmentStore } from '@/infrastructure/storage/runtimeEnvironmentStore';

export const HEALTH_QUERY_KEY = ['system-health'] as const;

export interface UseSystemHealthOptions {
  refetchInterval?: number | false;
  enabled?: boolean;
}

export function useRuntimeEnvironment(): [HealthMode, (next?: HealthMode) => void, boolean] {
  const [mode, setMode] = useState<HealthMode>(() => runtimeEnvironmentStore.getMode());
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    return runtimeEnvironmentStore.subscribe((newMode) => {
      startTransition(() => {
        setMode(newMode);
      });
    });
  }, []);

  const toggle = (next?: HealthMode) => {
    if (next) {
      runtimeEnvironmentStore.setMode(next);
    } else {
      runtimeEnvironmentStore.toggleMode();
    }
  };

  return [mode, toggle, isPending];
}

export function useSystemHealth(options?: UseSystemHealthOptions) {
  const { refetchInterval = 10000, enabled = true } = options || {};
  const [mode] = useRuntimeEnvironment();

  return useQuery<SystemHealth>({
    queryKey: [...HEALTH_QUERY_KEY, mode],
    queryFn: () => container.healthGateway.getHealth(),
    refetchInterval,
    enabled,
    staleTime: 4000,
  });
}

