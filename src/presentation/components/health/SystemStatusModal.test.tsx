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

  it('renders mode switch and allows toggling', async () => {
    const handleToggle = vi.fn();
    const user = userEvent.setup();

    render(
      <SystemStatusModal
        isOpen={true}
        health={healthySystem}
        onClose={vi.fn()}
        onToggleMode={handleToggle}
      />
    );

    const mockBtn = screen.getByRole('button', { name: /MOCK/i });
    await user.click(mockBtn);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it('renders latency quality and RFC-31 badge', () => {
    const rfcCompliantHealth = new SystemHealth('HEALTHY', 25, new Date(), [], {
      mode: 'LIVE',
      isRFC31Compliant: true,
      rawPayload: { status: 'healthy', checks: {} },
    });

    render(
      <SystemStatusModal isOpen={true} health={rfcCompliantHealth} onClose={vi.fn()} />
    );

    expect(screen.getByText(/Óptima/i)).toBeInTheDocument();
    expect(screen.getByText(/RFC-31: CUMPLIDO/i)).toBeInTheDocument();
  });

  it('toggles raw JSON inspector and copies payload', async () => {
    const user = userEvent.setup();
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextSpy },
      configurable: true,
      writable: true,
    });

    render(
      <SystemStatusModal isOpen={true} health={healthySystem} onClose={vi.fn()} />
    );

    const toggleJsonBtn = screen.getByRole('button', { name: /Payload HTTP en Vivo/i });
    await user.click(toggleJsonBtn);

    expect(screen.getByText(/Ocultar/i)).toBeInTheDocument();

    const copyBtn = screen.getByRole('button', { name: /Copiar JSON/i });
    await user.click(copyBtn);
    expect(writeTextSpy).toHaveBeenCalled();
  });
});

