import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpApprovalsAdapter } from './HttpApprovalsAdapter';
import * as apiClient from './apiClient';

describe('HttpApprovalsAdapter Infrastructure', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('parses pending approvals from backend response', async () => {
    const mockApiResponse = [
      {
        approval_id: 'appr-999',
        tool_name: 'refund_payment',
        arguments: { amount: 500, currency: 'USD' },
        requested_by: 'agent-1',
        reason: 'Refund request',
        status: 'PENDING',
        created_at: '2026-10-05T21:40:00Z',
      },
    ];

    vi.spyOn(apiClient, 'apiFetch').mockResolvedValue(mockApiResponse);

    const adapter = new HttpApprovalsAdapter();
    const result = await adapter.getPendingApprovals('corp-acme');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('appr-999');
    expect(result[0].toolName).toBe('refund_payment');
    expect(result[0].isPending).toBe(true);
  });

  it('posts decision resolution and returns updated ToolApprovalRequest', async () => {
    const mockDecisionResponse = {
      approval_id: 'appr-999',
      tool_name: 'refund_payment',
      arguments: { amount: 500, currency: 'USD' },
      requested_by: 'agent-1',
      reason: 'Refund request',
      status: 'APPROVED',
      resolved_by: 'sec-officer@corp.com',
      decision_reason: 'Audited and verified',
      created_at: '2026-10-05T21:40:00Z',
      resolved_at: '2026-10-05T21:45:00Z',
    };

    vi.spyOn(apiClient, 'apiFetch').mockResolvedValue(mockDecisionResponse);

    const adapter = new HttpApprovalsAdapter();
    const result = await adapter.resolveApproval({
      tenantId: 'corp-acme',
      approvalId: 'appr-999',
      decision: 'approve',
      reason: 'Audited and verified',
      resolvedBy: 'sec-officer@corp.com',
    });

    expect(result.status).toBe('APPROVED');
    expect(result.resolvedBy).toBe('sec-officer@corp.com');
  });
});
