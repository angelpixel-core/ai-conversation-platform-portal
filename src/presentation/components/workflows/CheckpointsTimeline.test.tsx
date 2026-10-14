import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CheckpointsTimeline } from './CheckpointsTimeline';
import { WorkflowCheckpoint } from '@/domain/workflows/WorkflowCheckpoint';

describe('CheckpointsTimeline Component', () => {
  it('renders list of checkpoints with version badges', () => {
    const chk1 = new WorkflowCheckpoint({
      id: 'chk-1',
      version: 1,
      node: 'supervisor',
      stateSnapshot: { step: 1 },
      createdAt: new Date('2026-10-12T20:00:00Z'),
    });
    const chk2 = new WorkflowCheckpoint({
      id: 'chk-2',
      version: 2,
      node: 'researcher',
      stateSnapshot: { step: 2 },
      createdAt: new Date('2026-10-12T20:01:00Z'),
    });

    render(<CheckpointsTimeline checkpoints={[chk1, chk2]} onInspect={vi.fn()} />);

    expect(screen.getByTestId('checkpoints-timeline')).toBeInTheDocument();
    expect(screen.getByText('v1')).toBeInTheDocument();
    expect(screen.getByText('v2')).toBeInTheDocument();
    expect(screen.getByText('2 Versiones')).toBeInTheDocument();
  });

  it('triggers onInspect callback when inspect button is clicked', () => {
    const chk1 = new WorkflowCheckpoint({
      id: 'chk-1',
      version: 1,
      node: 'supervisor',
      stateSnapshot: { query: 'test' },
      createdAt: new Date(),
    });
    const handleInspect = vi.fn();

    render(<CheckpointsTimeline checkpoints={[chk1]} onInspect={handleInspect} />);

    const btn = screen.getByRole('button', { name: /inspeccionar snapshot/i });
    fireEvent.click(btn);

    expect(handleInspect).toHaveBeenCalledWith(chk1);
  });
});
