import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { TenantTierBadge } from './TenantTierBadge';

describe('TenantTierBadge', () => {
  it('renders ENTERPRISE tier with cyber yellow background and bold text', () => {
    render(<TenantTierBadge tier="ENTERPRISE" />);
    const badge = screen.getByText('ENTERPRISE');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-[#FBBF24]');
  });

  it('renders PRO tier with cyan/sky styling', () => {
    render(<TenantTierBadge tier="PRO" />);
    const badge = screen.getByText('PRO');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-sky-300');
  });

  it('renders FREE tier with slate styling', () => {
    render(<TenantTierBadge tier="FREE" />);
    const badge = screen.getByText('FREE');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-slate-200');
  });
});
