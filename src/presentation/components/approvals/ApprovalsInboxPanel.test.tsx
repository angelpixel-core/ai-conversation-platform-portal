import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ApprovalsInboxPanel } from './ApprovalsInboxPanel';
import { MockApprovalsGateway } from '@/infrastructure/api/MockApprovalsGateway';

describe('ApprovalsInboxPanel Component', () => {
  it('renders title, counter badges, and approval cards', async () => {
    const gateway = new MockApprovalsGateway();
    render(<ApprovalsInboxPanel gateway={gateway} tenantId="corp-acme" />);

    expect(screen.getByText(/Centro de Aprobaciones Human-in-the-Loop/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/refund_payment/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/execute_sql_query/i)).toBeInTheDocument();
  });

  it('filters approvals when switching tabs', async () => {
    const gateway = new MockApprovalsGateway();
    render(<ApprovalsInboxPanel gateway={gateway} tenantId="corp-acme" />);

    await waitFor(() => {
      expect(screen.getByText(/refund_payment/i)).toBeInTheDocument();
    });

    // Click on "APROBADAS" tab
    const approvedTab = screen.getByRole('button', { name: /Aprobadas/i });
    fireEvent.click(approvedTab);

    await waitFor(() => {
      expect(screen.getByText(/export_customer_data/i)).toBeInTheDocument();
      expect(screen.queryByText(/refund_payment/i)).not.toBeInTheDocument();
    });
  });

  it('opens inspector modal when clicking inspect on a card', async () => {
    const gateway = new MockApprovalsGateway();
    render(<ApprovalsInboxPanel gateway={gateway} tenantId="corp-acme" />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Inspeccionar Argumentos/i })[0]).toBeInTheDocument();
    });

    const inspectButtons = screen.getAllByRole('button', { name: /Inspeccionar Argumentos/i });
    fireEvent.click(inspectButtons[0]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Argumentos de Invocación/i)).toBeInTheDocument();
  });
});
