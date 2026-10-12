import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useMessageDeliveryStatus } from './useMessageDeliveryStatus';
import { MockOutboxGateway } from '@/infrastructure/api/MockOutboxGateway';

describe('useMessageDeliveryStatus', () => {
  it('should initialize with PENDING_OUTBOX status', async () => {
    const gateway = new MockOutboxGateway();
    const { result } = renderHook(() =>
      useMessageDeliveryStatus({
        conversationId: 'conv-10',
        messageId: 'msg-01',
        gateway,
        initialStatus: 'PENDING_OUTBOX',
      })
    );

    expect(result.current.deliveryState.status).toBe('PENDING_OUTBOX');
  });

  it('should allow manual retry and set status back to PENDING_OUTBOX', async () => {
    const gateway = new MockOutboxGateway();
    gateway.setStatus('conv-10', 'msg-fail', 'FAILED_DLQ', { errorMessage: 'Queue overflow' });

    const { result } = renderHook(() =>
      useMessageDeliveryStatus({
        conversationId: 'conv-10',
        messageId: 'msg-fail',
        gateway,
        initialStatus: 'FAILED_DLQ',
      })
    );

    expect(result.current.deliveryState.status).toBe('FAILED_DLQ');
    expect(result.current.deliveryState.requiresAttention).toBe(true);

    await act(async () => {
      await result.current.retry();
    });

    expect(result.current.deliveryState.status).toBe('PENDING_OUTBOX');
  });

  it('should advance simulated status when advanceSimulation is triggered', async () => {
    const gateway = new MockOutboxGateway();
    const { result } = renderHook(() =>
      useMessageDeliveryStatus({
        conversationId: 'conv-10',
        messageId: 'msg-sim',
        gateway,
      })
    );

    act(() => {
      result.current.advanceSimulation('QUEUED_BROKER');
    });

    expect(result.current.deliveryState.status).toBe('QUEUED_BROKER');
  });
});
