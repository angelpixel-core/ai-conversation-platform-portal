import { describe, it, expect } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useApprovalsInbox } from './useApprovalsInbox';
import { MockApprovalsGateway } from '@/infrastructure/api/MockApprovalsGateway';

describe('useApprovalsInbox Application Hook', () => {
  it('loads pending and all approvals correctly', async () => {
    const gateway = new MockApprovalsGateway();

    const { result } = renderHook(() =>
      useApprovalsInbox({ tenantId: 'corp-acme', gateway })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.approvals.length).toBeGreaterThanOrEqual(2);
    expect(result.current.pendingCount).toBeGreaterThanOrEqual(2);
  });

  it('resolves an approval and updates the list', async () => {
    const gateway = new MockApprovalsGateway();

    const { result } = renderHook(() =>
      useApprovalsInbox({ tenantId: 'corp-acme', gateway })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const targetId = result.current.approvals[0].id;

    await act(async () => {
      await result.current.resolveApproval(
        targetId,
        'approve',
        'Verified by security audit team',
        'auditor@corp.com'
      );
    });

    const resolved = result.current.approvals.find((a) => a.id === targetId);
    expect(resolved?.status).toBe('APPROVED');
    expect(resolved?.decisionReason).toBe('Verified by security audit team');
  });

  it('filters approvals by status', async () => {
    const gateway = new MockApprovalsGateway();

    const { result } = renderHook(() =>
      useApprovalsInbox({ tenantId: 'corp-acme', gateway })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setFilter('APPROVED');
    });

    expect(result.current.filteredApprovals.every((a) => a.status === 'APPROVED')).toBe(true);
  });
});
