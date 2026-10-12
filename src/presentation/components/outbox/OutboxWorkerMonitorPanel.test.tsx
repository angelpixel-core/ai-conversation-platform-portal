import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { OutboxWorkerMonitorPanel } from './OutboxWorkerMonitorPanel';

describe('OutboxWorkerMonitorPanel', () => {
  it('renders outbox monitor title, architecture metrics, and queue names', () => {
    render(<OutboxWorkerMonitorPanel />);

    expect(screen.getByText(/MONITOR DE DESPACHO ASÍNCRONO/i)).toBeInTheDocument();
    expect(screen.getAllByText(/conversation\.llm_processing\.queue/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/conversation\.dlx/i)).toBeInTheDocument();
  });

  it('renders simulation trigger buttons', () => {
    render(<OutboxWorkerMonitorPanel />);

    expect(screen.getByRole('button', { name: /Simular Flujo Completo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Simular Incidente DLQ/i })).toBeInTheDocument();
  });

  it('triggers simulated DLQ failure and allows retrying the message', () => {
    render(<OutboxWorkerMonitorPanel />);

    const dlqButton = screen.getByRole('button', { name: /Simular Incidente DLQ/i });
    fireEvent.click(dlqButton);

    expect(screen.getAllByText(/DLQ/i).length).toBeGreaterThan(0);
    const retryButtons = screen.getAllByRole('button', { name: /Reintentar/i });
    expect(retryButtons.length).toBeGreaterThan(0);

    fireEvent.click(retryButtons[0]);
    expect(screen.getAllByText(/Outbox/i).length).toBeGreaterThan(0);
  });
});
