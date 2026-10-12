import { useState, useEffect, useCallback, useMemo } from 'react';
import { ApprovalsGateway } from '@/domain/approvals/ApprovalsGateway';
import {
  ToolApprovalRequest,
  ApprovalDecision,
} from '@/domain/approvals/ToolApprovalRequest';
import { useTenant } from '@/application/tenants/TenantContext';
import { MockApprovalsGateway } from '@/infrastructure/api/MockApprovalsGateway';
import { HttpApprovalsAdapter } from '@/infrastructure/api/HttpApprovalsAdapter';

export type ApprovalFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface UseApprovalsInboxOptions {
  tenantId?: string;
  gateway?: ApprovalsGateway;
}

const defaultGateway: ApprovalsGateway =
  process.env.NEXT_PUBLIC_USE_MOCKS !== 'false'
    ? new MockApprovalsGateway()
    : new HttpApprovalsAdapter();

export function useApprovalsInbox(options: UseApprovalsInboxOptions = {}) {
  let sessionTenantId = 'corp-acme';
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const tenantCtx = useTenant();
    if (tenantCtx?.activeTenant?.id.value) {
      sessionTenantId = tenantCtx.activeTenant.id.value;
    }
  } catch {
    // If used outside TenantProvider, fallback to default
  }

  const tenantId = options.tenantId || sessionTenantId;
  const gateway = options.gateway || defaultGateway;

  const [approvals, setApprovals] = useState<ToolApprovalRequest[]>([]);
  const [filter, setFilter] = useState<ApprovalFilter>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadApprovals = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await gateway.getAllApprovals(tenantId);
      setApprovals(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error fetching approvals';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [gateway, tenantId]);

  useEffect(() => {
    loadApprovals();
  }, [loadApprovals]);

  const resolveApproval = useCallback(
    async (
      approvalId: string,
      decision: ApprovalDecision,
      reason: string,
      resolvedBy: string = 'operator@corp.com'
    ) => {
      try {
        setIsResolving(true);
        setError(null);
        const resolved = await gateway.resolveApproval({
          tenantId,
          approvalId,
          decision,
          reason,
          resolvedBy,
        });

        setApprovals((prev) =>
          prev.map((item) => (item.id === approvalId ? resolved : item))
        );
        return resolved;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error resolving approval';
        setError(message);
        throw err;
      } finally {
        setIsResolving(false);
      }
    },
    [gateway, tenantId]
  );

  const simulateNewRequest = useCallback(async () => {
    if (!gateway.simulateNewApprovalRequest) return;
    try {
      const newReq = await gateway.simulateNewApprovalRequest(tenantId);
      setApprovals((prev) => [newReq, ...prev]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error simulating approval';
      setError(message);
    }
  }, [gateway, tenantId]);

  const filteredApprovals = useMemo(() => {
    if (filter === 'ALL') return approvals;
    return approvals.filter((item) => item.status === filter);
  }, [approvals, filter]);

  const pendingCount = useMemo(() => {
    return approvals.filter((item) => item.isPending).length;
  }, [approvals]);

  return {
    approvals,
    filteredApprovals,
    filter,
    setFilter,
    pendingCount,
    isLoading,
    isResolving,
    error,
    refresh: loadApprovals,
    resolveApproval,
    simulateNewRequest,
  };
}
