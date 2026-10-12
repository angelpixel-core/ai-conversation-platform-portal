import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { TenantSwitchGuardModal } from './TenantSwitchGuardModal';
import { Tenant } from '@/domain/tenants/Tenant';
import { TenantId } from '@/domain/tenants/TenantId';

describe('TenantSwitchGuardModal', () => {
  const currentTenant = new Tenant(TenantId.create('corp-acme'), 'Acme Corporation', 'ENTERPRISE');
  const targetTenant = new Tenant(TenantId.create('corp-globex'), 'Globex Industries', 'PRO');

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <TenantSwitchGuardModal
        isOpen={false}
        currentTenant={currentTenant}
        targetTenant={targetTenant}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders warning content, current tenant and target tenant when open', () => {
    render(
      <TenantSwitchGuardModal
        isOpen={true}
        currentTenant={currentTenant}
        targetTenant={targetTenant}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Cambio de Espacio de Trabajo/i)).toBeInTheDocument();
    expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
    expect(screen.getByText('Globex Industries')).toBeInTheDocument();
    expect(screen.getByText(/Se limpiará la conversación y estado en memoria/i)).toBeInTheDocument();
  });

  it('fires onConfirm when confirming and onCancel when canceling', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(
      <TenantSwitchGuardModal
        isOpen={true}
        currentTenant={currentTenant}
        targetTenant={targetTenant}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    await user.click(cancelBtn);
    expect(onCancel).toHaveBeenCalledTimes(1);

    const confirmBtn = screen.getByRole('button', { name: /Confirmar Cambio/i });
    await user.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
