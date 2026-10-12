import { useQuery } from '@tanstack/react-query';
import { container } from '@/infrastructure/container';
import { Tenant } from '@/domain/tenants/Tenant';

export const TENANTS_QUERY_KEY = ['tenants-list'] as const;

export function useTenantsList() {
  return useQuery<Tenant[]>({
    queryKey: TENANTS_QUERY_KEY,
    queryFn: () => container.tenantGateway.getTenants(),
    staleTime: 60000,
  });
}
