import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SystemStatusPill } from './SystemStatusPill';
import { SystemHealth } from '@/domain/health/SystemHealth';

describe('SystemStatusPill (Presentation Component)', () => {
  it('should render online text and neon green indicator when health is HEALTHY', () => {
    const health = new SystemHealth('HEALTHY', 35, new Date());
    render(<SystemStatusPill health={health} />);

    expect(screen.getByText(/SISTEMA ONLINE/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', expect.stringContaining('SISTEMA ONLINE'));
  });

  it('should render offline text when health is DOWN', () => {
    const health = new SystemHealth('DOWN', 0, new Date());
    render(<SystemStatusPill health={health} />);

    expect(screen.getByText(/SIN CONEXIÓN/i)).toBeInTheDocument();
  });

  it('should trigger onClick when clicked to open diagnosis modal', () => {
    const health = new SystemHealth('HEALTHY', 35, new Date());
    const handleClick = vi.fn();
    render(<SystemStatusPill health={health} onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
