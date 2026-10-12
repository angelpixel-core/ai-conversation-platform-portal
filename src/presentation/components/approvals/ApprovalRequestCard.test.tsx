import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ApprovalRequestCard } from './ApprovalRequestCard';
import { ToolApprovalRequest } from '@/domain/approvals/ToolApprovalRequest';

describe('ApprovalRequestCard Component', () => {
  const pendingRequest = new ToolApprovalRequest(
    'appr-123',
    'refund_payment',
    { amount: 500, currency: 'USD' },
    'agent-financial-advisor',
    'Customer cancellation refund outside standard SLA',
    'PENDING',
    new Date('2026-10-05T21:40:00Z')
  );

  const approvedRequest = new ToolApprovalRequest(
    'appr-456',
    'export_customer_data',
    { format: 'parquet' },
    'agent-analytics-exporter',
    'Periodic audit export',
    'APPROVED',
    new Date('2026-10-05T20:00:00Z'),
    'sec-officer@corp.com',
    'Verified with compliance'
  );

  it('renders tool name, requesting agent, status badge, and reason', () => {
    render(
      <ApprovalRequestCard
        request={pendingRequest}
        onInspect={vi.fn()}
      />
    );

    expect(screen.getByText(/refund_payment/i)).toBeInTheDocument();
    expect(screen.getByText(/agent-financial-advisor/i)).toBeInTheDocument();
    expect(screen.getByText(/PENDING/i)).toBeInTheDocument();
    expect(screen.getByText(/Customer cancellation refund/i)).toBeInTheDocument();
  });

  it('triggers onInspect callback when clicking the Inspect button', () => {
    const handleInspect = vi.fn();
    render(
      <ApprovalRequestCard
        request={pendingRequest}
        onInspect={handleInspect}
      />
    );

    const inspectBtn = screen.getByRole('button', { name: /Inspeccionar Argumentos/i });
    fireEvent.click(inspectBtn);

    expect(handleInspect).toHaveBeenCalledWith(pendingRequest);
  });

  it('displays resolved details when request is approved', () => {
    render(
      <ApprovalRequestCard
        request={approvedRequest}
        onInspect={vi.fn()}
      />
    );

    expect(screen.getByText(/APPROVED/i)).toBeInTheDocument();
    expect(screen.getByText(/sec-officer@corp.com/i)).toBeInTheDocument();
  });
});
