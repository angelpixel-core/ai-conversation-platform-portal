import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SnapshotInspectorModal } from './SnapshotInspectorModal';
import { WorkflowCheckpoint } from '@/domain/workflows/WorkflowCheckpoint';

describe('SnapshotInspectorModal Component', () => {
  it('renders nothing when checkpoint is null', () => {
    const { container } = render(<SnapshotInspectorModal checkpoint={null} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders modal with formatted JSON and allows closing', () => {
    const chk = new WorkflowCheckpoint({
      id: 'chk-v2',
      version: 2,
      node: 'researcher',
      stateSnapshot: { findings: ['Item A', 'Item B'] },
      createdAt: new Date('2026-10-12T20:00:00Z'),
    });
    const handleClose = vi.fn();

    render(<SnapshotInspectorModal checkpoint={chk} onClose={handleClose} />);

    expect(screen.getByTestId('snapshot-inspector-modal')).toBeInTheDocument();
    expect(screen.getByText(/chk-v2 \(v2\)/i)).toBeInTheDocument();
    expect(screen.getByTestId('snapshot-json-viewer')).toHaveTextContent('"Item A"');

    const closeBtn = screen.getByRole('button', { name: /cerrar modal/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
