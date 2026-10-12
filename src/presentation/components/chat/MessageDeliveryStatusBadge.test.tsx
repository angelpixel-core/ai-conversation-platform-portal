import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageDeliveryStatusBadge } from './MessageDeliveryStatusBadge';

describe('MessageDeliveryStatusBadge', () => {
  it('renders PENDING_OUTBOX state with hourglass icon', () => {
    render(<MessageDeliveryStatusBadge status="PENDING_OUTBOX" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/Outbox/i)).toBeInTheDocument();
  });

  it('renders QUEUED_BROKER state with RabbitMQ queue info', () => {
    render(<MessageDeliveryStatusBadge status="QUEUED_BROKER" queue="conversation.llm_processing.queue" />);
    expect(screen.getByText(/RabbitMQ/i)).toBeInTheDocument();
  });

  it('renders PROCESSING_WORKER state with gear icon and workerId if present', () => {
    render(<MessageDeliveryStatusBadge status="PROCESSING_WORKER" workerId="worker-01" />);
    expect(screen.getByText(/Worker/i)).toBeInTheDocument();
  });

  it('renders COMPLETED state with checkmark', () => {
    render(<MessageDeliveryStatusBadge status="COMPLETED" />);
    expect(screen.getByText(/Entregado|Delivered/i)).toBeInTheDocument();
  });

  it('renders FAILED_DLQ state with retry button and calls onRetry when clicked', () => {
    const handleRetry = vi.fn();
    render(<MessageDeliveryStatusBadge status="FAILED_DLQ" onRetry={handleRetry} />);

    expect(screen.getByText(/DLQ/i)).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /Reintentar|Retry/i });
    expect(retryBtn).toBeInTheDocument();

    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});
