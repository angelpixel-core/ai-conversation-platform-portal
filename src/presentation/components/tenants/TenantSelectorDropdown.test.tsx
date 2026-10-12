import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { TenantSelectorDropdown } from './TenantSelectorDropdown';
import { Tenant } from '@/domain/tenants/Tenant';
import { TenantId } from '@/domain/tenants/TenantId';

describe('TenantSelectorDropdown', () => {
  const tenants = [
    new Tenant(TenantId.create('corp-acme'), 'Acme Corporation', 'ENTERPRISE'),
    new Tenant(TenantId.create('corp-globex'), 'Globex Industries', 'PRO'),
  ];

  it('renders active tenant name, avatar, and tier badge', () => {
    render(
      <TenantSelectorDropdown
        activeTenant={tenants[0]}
        tenants={tenants}
        onSelectTenant={vi.fn()}
      />
    );

    expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
    expect(screen.getByText('ENTERPRISE')).toBeInTheDocument();
    expect(screen.getByText('AC')).toBeInTheDocument();
  });

  it('opens dropdown menu on click and lists all tenants', async () => {
    const user = userEvent.setup();
    render(
      <TenantSelectorDropdown
        activeTenant={tenants[0]}
        tenants={tenants}
        onSelectTenant={vi.fn()}
      />
    );

    const toggleBtn = screen.getByRole('button', { name: /Seleccionar espacio corporativo/i });
    await user.click(toggleBtn);

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('Globex Industries')).toBeInTheDocument();
  });

  it('calls onSelectTenant when clicking another tenant option', async () => {
    const handleSelect = vi.fn();
    const user = userEvent.setup();

    render(
      <TenantSelectorDropdown
        activeTenant={tenants[0]}
        tenants={tenants}
        onSelectTenant={handleSelect}
      />
    );

    const toggleBtn = screen.getByRole('button', { name: /Seleccionar espacio corporativo/i });
    await user.click(toggleBtn);

    const globexOption = screen.getByRole('option', { name: /Globex Industries/i });
    await user.click(globexOption);

    expect(handleSelect).toHaveBeenCalledWith(tenants[1]);
  });
});
