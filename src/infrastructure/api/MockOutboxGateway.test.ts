import { describe, it, expect, beforeEach } from 'vitest';
import { MockOutboxGateway } from './MockOutboxGateway';

describe('MockOutboxGateway', () => {
  let gateway: MockOutboxGateway;

  beforeEach(() => {
    gateway = new MockOutboxGateway();
  });

  it('should initialize a message status as PENDING_OUTBOX if not set', async () => {
    const status = await gateway.getMessageDeliveryStatus('conv-1', 'msg-1');
    expect(status.messageId).toBe('msg-1');
    expect(status.status).toBe('PENDING_OUTBOX');
  });

  it('should advance message lifecycle on subsequent inquiries or advanceCall', async () => {
    gateway.setStatus('conv-1', 'msg-1', 'QUEUED_BROKER');
    const status = await gateway.getMessageDeliveryStatus('conv-1', 'msg-1');
    expect(status.status).toBe('QUEUED_BROKER');
    expect(status.queue).toContain('conversation');
  });

  it('should support manual retry for messages in FAILED_DLQ', async () => {
    gateway.setStatus('conv-1', 'msg-fail', 'FAILED_DLQ', { errorMessage: 'Simulated Timeout' });
    const failedStatus = await gateway.getMessageDeliveryStatus('conv-1', 'msg-fail');
    expect(failedStatus.status).toBe('FAILED_DLQ');
    expect(failedStatus.requiresAttention).toBe(true);

    const retried = await gateway.retryDelivery('conv-1', 'msg-fail');
    expect(retried.status).toBe('PENDING_OUTBOX');
  });
});
