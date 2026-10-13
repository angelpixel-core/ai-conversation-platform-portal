import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { StreamingMonitorPanel } from './StreamingMonitorPanel';
import { MockStreamingGateway } from '@/infrastructure/api/MockStreamingGateway';

describe('StreamingMonitorPanel Component', () => {
  it('renders header, metrics cards, and action buttons', () => {
    const gateway = new MockStreamingGateway({ tokenDelayMs: 5 });
    render(<StreamingMonitorPanel gateway={gateway} />);

    expect(screen.getByText(/streaming en tiempo real resiliente/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar streaming/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /simular corte de red/i })).toBeInTheDocument();
  });

  it('starts streaming and completes when Iniciar Streaming is clicked', async () => {
    const gateway = new MockStreamingGateway({ tokenDelayMs: 5 });
    render(<StreamingMonitorPanel gateway={gateway} />);

    const startBtn = screen.getByRole('button', { name: /iniciar streaming/i });
    fireEvent.click(startBtn);

    await waitFor(
      () => {
        expect(screen.getByText(/flujo completado/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    expect(screen.getByText(/espresso/i)).toBeInTheDocument();
  });

  it('shows recovery banner when network drop is simulated', async () => {
    const gateway = new MockStreamingGateway({
      tokenDelayMs: 5,
      dropAtSequence: 4,
    });
    render(<StreamingMonitorPanel gateway={gateway} />);

    const dropBtn = screen.getByRole('button', { name: /simular corte de red/i });
    fireEvent.click(dropBtn);

    await waitFor(
      () => {
        expect(screen.getByText(/desconexión de red/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    expect(screen.getByText(/Last-Event-ID: 4/i)).toBeInTheDocument();
  });
});
