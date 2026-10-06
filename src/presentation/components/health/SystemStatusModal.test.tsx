import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { SystemStatusModal } from './SystemStatusModal';
import { SystemHealth } from '@/domain/health/SystemHealth';

describe('SystemStatusModal', () => {
  const healthySystem = new SystemHealth('HEALTHY', 45, new Date('2026-10-06T12:00:00Z'), [
    { name: 'database', status: 'HEALTHY', latencyMs: 12, database: 'chatbot_dev' },
    { name: 'broker', status: 'HEALTHY', latencyMs: 5, message: 'RabbitMQ operational' },
  ]);

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <SystemStatusModal isOpen={false} health={healthySystem} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal with title, status, latency and component checks when isOpen is true', () => {
    render(
      <SystemStatusModal isOpen={true} health={healthySystem} onClose={vi.fn()} />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Diagnóstico del Sistema/i)).toBeInTheDocument();
    expect(screen.getByText(/45ms/i)).toBeInTheDocument();
    expect(screen.getByText('database')).toBeInTheDocument();
    expect(screen.getByText('broker')).toBeInTheDocument();
    expect(screen.getByText('chatbot_dev')).toBeInTheDocument();
  });

  it('renders links to Swagger UI and ReDoc', () => {
    render(
      <SystemStatusModal isOpen={true} health={healthySystem} onClose={vi.fn()} />
    );

    const swaggerLink = screen.getByRole('link', { name: /Swagger UI/i });
    const redocLink = screen.getByRole('link', { name: /ReDoc/i });

    expect(swaggerLink).toHaveAttribute('href', expect.stringContaining('/docs'));
    expect(redocLink).toHaveAttribute('href', expect.stringContaining('/redoc'));
  });

  it('calls onClose when close button is clicked or Escape key is pressed', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <SystemStatusModal isOpen={true} health={healthySystem} onClose={handleClose} />
    );

    const closeBtn = screen.getByRole('button', { name: /Cerrar modal/i });
    await user.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    await user.keyboard('{Escape}');
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
