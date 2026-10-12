import { describe, it, expect } from 'vitest';
import { ToolApprovalRequest } from './ToolApprovalRequest';

describe('ToolApprovalRequest Domain Entity', () => {
  const sampleRequest = new ToolApprovalRequest(
    'appr-123',
    'refund_payment',
    { amount: 500, currency: 'USD', customerId: 'cust-8812' },
    'agent-financial-advisor',
    'Customer cancellation refund',
    'PENDING',
    new Date('2026-10-05T21:40:00Z')
  );

  it('correctly identifies pending status and formats JSON arguments', () => {
    expect(sampleRequest.isPending).toBe(true);
    expect(sampleRequest.formattedArguments).toContain('"amount": 500');
    expect(sampleRequest.formattedArguments).toContain('"currency": "USD"');
  });

  it('transitions to APPROVED state when decision is approve with valid reason', () => {
    const resolved = sampleRequest.withDecision(
      'approve',
      'Verified refund policy with finance team',
      'sec-officer@corp.com',
      new Date('2026-10-05T21:42:00Z')
    );

    expect(resolved.status).toBe('APPROVED');
    expect(resolved.isPending).toBe(false);
    expect(resolved.resolvedBy).toBe('sec-officer@corp.com');
    expect(resolved.decisionReason).toBe('Verified refund policy with finance team');
    expect(resolved.resolvedAt).toBeInstanceOf(Date);
  });

  it('transitions to REJECTED state when decision is reject with valid reason', () => {
    const resolved = sampleRequest.withDecision(
      'reject',
      'Customer dispute ongoing, refund denied',
      'compliance@corp.com'
    );

    expect(resolved.status).toBe('REJECTED');
    expect(resolved.isPending).toBe(false);
    expect(resolved.resolvedBy).toBe('compliance@corp.com');
    expect(resolved.decisionReason).toBe('Customer dispute ongoing, refund denied');
  });

  it('throws an error if resolving a request without an audit justification reason', () => {
    expect(() => {
      sampleRequest.withDecision('approve', '   ', 'sec-officer@corp.com');
    }).toThrow(/Audit justification is required/i);
  });

  it('throws an error when trying to resolve an already resolved request', () => {
    const resolved = sampleRequest.withDecision(
      'approve',
      'Approved initial request',
      'sec-officer@corp.com'
    );

    expect(() => {
      resolved.withDecision('reject', 'Attempting re-resolution', 'sec-officer@corp.com');
    }).toThrow(/Cannot resolve a request that is not PENDING/i);
  });
});
