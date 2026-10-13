import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { StreamRecoveryBanner } from './StreamRecoveryBanner';

describe('StreamRecoveryBanner Component', () => {
  it('renders nothing when isReconnecting is false', () => {
    const { container } = render(
      <StreamRecoveryBanner isReconnecting={false} lastEventId={4} onResume={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders recovery alert with lastEventId when isReconnecting is true', () => {
    const onResume = vi.fn();
    render(
      <StreamRecoveryBanner isReconnecting={true} lastEventId={4} onResume={onResume} />
    );

    expect(screen.getByText(/desconexión de red/i)).toBeInTheDocument();
    expect(screen.getByText(/Last-Event-ID: 4/i)).toBeInTheDocument();

    const resumeBtn = screen.getByRole('button', { name: /reintentar ahora/i });
    expect(resumeBtn).toBeInTheDocument();
    fireEvent.click(resumeBtn);
    expect(onResume).toHaveBeenCalledTimes(1);
  });
});
