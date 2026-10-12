import { describe, it, expect } from 'vitest';
import { DeliveryStatus, MessageDeliveryState } from './DeliveryStatus';

describe('MessageDeliveryState (Domain Entity)', () => {
  it('should initialize with correct attributes', () => {
    const now = new Date();
    const state = new MessageDeliveryState('msg-001', 'PENDING_OUTBOX', now);

    expect(state.messageId).toBe('msg-001');
    expect(state.status).toBe('PENDING_OUTBOX');
    expect(state.updatedAt).toEqual(now);
    expect(state.isTerminal).toBe(false);
    expect(state.requiresAttention).toBe(false);
  });

  it('should correctly flag isTerminal for COMPLETED and FAILED_DLQ', () => {
    const completed = new MessageDeliveryState('msg-002', 'COMPLETED', new Date());
    const failed = new MessageDeliveryState('msg-003', 'FAILED_DLQ', new Date(), undefined, undefined, 'Timeout');
    const processing = new MessageDeliveryState('msg-004', 'PROCESSING_WORKER', new Date());

    expect(completed.isTerminal).toBe(true);
    expect(failed.isTerminal).toBe(true);
    expect(processing.isTerminal).toBe(false);
  });

  it('should correctly flag requiresAttention only for FAILED_DLQ', () => {
    const failed = new MessageDeliveryState('msg-003', 'FAILED_DLQ', new Date(), undefined, undefined, 'DLQ Error');
    const queued = new MessageDeliveryState('msg-005', 'QUEUED_BROKER', new Date());

    expect(failed.requiresAttention).toBe(true);
    expect(queued.requiresAttention).toBe(false);
  });

  it('should support transitioning to new delivery status while creating immutable instance', () => {
    const initial = new MessageDeliveryState('msg-001', 'PENDING_OUTBOX', new Date('2026-10-12T12:00:00Z'));
    const updated = initial.transitionTo('QUEUED_BROKER', { queue: 'conversation.events' });

    expect(initial.status).toBe('PENDING_OUTBOX');
    expect(updated.status).toBe('QUEUED_BROKER');
    expect(updated.queue).toBe('conversation.events');
    expect(updated.messageId).toBe('msg-001');
  });
});
