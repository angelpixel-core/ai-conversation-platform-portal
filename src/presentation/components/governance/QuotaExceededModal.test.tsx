import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { QuotaExceededModal } from './QuotaExceededModal';

describe('QuotaExceededModal Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <QuotaExceededModal isOpen={false} tenantId="corp-acme" onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal details when open, including HTTP 402 indicator and amounts', () => {
    render(
      <QuotaExceededModal
        isOpen={true}
        tenantId="corp-acme"
        requestedCost={99999}
        availableBalance={850}
        errorMessage="Presupuesto insuficiente o cuota excedida"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/HTTP 402 PAYMENT REQUIRED/i)).toBeInTheDocument();
    expect(screen.getByText(/Cuota de Tokens Excedida/i)).toBeInTheDocument();
    expect(screen.getByText('$99999.00 USD')).toBeInTheDocument();
    expect(screen.getByText('$850.00 USD')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <QuotaExceededModal isOpen={true} tenantId="corp-acme" onClose={onClose} />
    );

    const closeBtn = screen.getByRole('button', { name: /Cerrar modal de cuota/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
