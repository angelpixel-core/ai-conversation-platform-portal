import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ToolArgumentsInspectorModal } from './ToolArgumentsInspectorModal';
import { ToolApprovalRequest } from '@/domain/approvals/ToolApprovalRequest';

describe('ToolArgumentsInspectorModal Component', () => {
  const mockRequest = new ToolApprovalRequest(
    'appr-123',
    'refund_payment',
    { amount: 500, currency: 'USD', customer_id: 'cust-8812' },
    'agent-financial-advisor',
    'Customer refund requested outside standard SLA',
    'PENDING',
    new Date('2026-10-05T21:40:00Z')
  );

  it('renders tool details, agent, and formatted JSON arguments', () => {
    render(
      <ToolArgumentsInspectorModal
        isOpen={true}
        request={mockRequest}
        onClose={vi.fn()}
        onResolve={vi.fn()}
        isResolving={false}
      />
    );

    expect(screen.getByText(/refund_payment/i)).toBeInTheDocument();
    expect(screen.getByText(/agent-financial-advisor/i)).toBeInTheDocument();
    expect(screen.getByText(/"amount": 500/i)).toBeInTheDocument();
    expect(screen.getByText(/"currency": "USD"/i)).toBeInTheDocument();
  });

  it('disables or warns when attempting to approve without audit justification', () => {
    const handleResolve = vi.fn();
    render(
      <ToolArgumentsInspectorModal
        isOpen={true}
        request={mockRequest}
        onClose={vi.fn()}
        onResolve={handleResolve}
        isResolving={false}
      />
    );

    const approveButton = screen.getByRole('button', { name: /Aprobar Ejecución/i });
    fireEvent.click(approveButton);

    expect(handleResolve).not.toHaveBeenCalled();
    expect(screen.getByText(/La justificación de auditoría es obligatoria/i)).toBeInTheDocument();
  });

  it('submits decision when justification is provided', () => {
    const handleResolve = vi.fn();
    render(
      <ToolArgumentsInspectorModal
        isOpen={true}
        request={mockRequest}
        onClose={vi.fn()}
        onResolve={handleResolve}
        isResolving={false}
      />
    );

    const textarea = screen.getByPlaceholderText(/Ingrese la justificación de auditoría/i);
    fireEvent.change(textarea, { target: { value: 'Aprobado tras verificar con líder de finanzas' } });

    const approveButton = screen.getByRole('button', { name: /Aprobar Ejecución/i });
    fireEvent.click(approveButton);

    expect(handleResolve).toHaveBeenCalledWith(
      'appr-123',
      'approve',
      'Aprobado tras verificar con líder de finanzas',
      expect.any(String)
    );
  });
});
