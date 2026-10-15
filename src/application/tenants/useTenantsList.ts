import { useQuery } from '@tanstack/react-query';
import { container } from '@/infrastructure/container';
import { Tenant } from '@/domain/tenants/Tenant';
import { useRuntimeEnvironment } from '@/application/health/useSystemHealth';

export const TENANTS_QUERY_KEY = ['tenants-list'] as const;

export function useTenantsList() {
  const [mode] = useRuntimeEnvironment();

  return useQuery<Tenant[]>({
    queryKey: [...TENANTS_QUERY_KEY, mode],
    queryFn: () => container.tenantGateway.getTenants(),
    staleTime: 30000,
  });
}
