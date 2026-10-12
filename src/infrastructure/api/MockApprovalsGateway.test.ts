import { describe, it, expect } from 'vitest';
import { MockApprovalsGateway } from './MockApprovalsGateway';

describe('MockApprovalsGateway Infrastructure', () => {
  it('returns initial pending approvals for a tenant', async () => {
    const gateway = new MockApprovalsGateway();
    const pending = await gateway.getPendingApprovals('corp-acme');

    expect(pending.length).toBeGreaterThanOrEqual(2);
    expect(pending[0].isPending).toBe(true);
    expect(pending[0].toolName).toBe('refund_payment');
  });

  it('resolves an approval with approve decision', async () => {
    const gateway = new MockApprovalsGateway();
    const pending = await gateway.getPendingApprovals('corp-acme');
    const target = pending[0];

    const resolved = await gateway.resolveApproval({
      tenantId: 'corp-acme',
      approvalId: target.id,
      decision: 'approve',
      reason: 'Authorized by finance lead',
      resolvedBy: 'auditor@corp.com',
    });

    expect(resolved.status).toBe('APPROVED');
    expect(resolved.resolvedBy).toBe('auditor@corp.com');
    expect(resolved.decisionReason).toBe('Authorized by finance lead');

    // Should no longer be in pending
    const remainingPending = await gateway.getPendingApprovals('corp-acme');
    expect(remainingPending.find((r) => r.id === target.id)).toBeUndefined();
  });

  it('resolves an approval with reject decision', async () => {
    const gateway = new MockApprovalsGateway();
    const pending = await gateway.getPendingApprovals('corp-acme');
    const target = pending[1];

    const resolved = await gateway.resolveApproval({
      tenantId: 'corp-acme',
      approvalId: target.id,
      decision: 'reject',
      reason: 'Dangerous operation outside maintenance window',
      resolvedBy: 'security@corp.com',
    });

    expect(resolved.status).toBe('REJECTED');
    expect(resolved.decisionReason).toBe('Dangerous operation outside maintenance window');
  });

  it('allows simulating a new incoming approval request', async () => {
    const gateway = new MockApprovalsGateway();
    const newReq = await gateway.simulateNewApprovalRequest('corp-acme');

    expect(newReq.isPending).toBe(true);
    const pending = await gateway.getPendingApprovals('corp-acme');
    expect(pending.find((r) => r.id === newReq.id)).toBeDefined();
  });
});
