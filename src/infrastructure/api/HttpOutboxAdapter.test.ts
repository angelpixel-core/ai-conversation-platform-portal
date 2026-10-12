import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpOutboxAdapter } from './HttpOutboxAdapter';

describe('HttpOutboxAdapter', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should parse 200 responses from backend status endpoint', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        message_id: 'msg-456',
        status: 'PROCESSING_WORKER',
        queue: 'conversation.llm_processing.queue',
        broker: 'rabbitmq',
        worker_id: 'worker-1',
        dispatched_at: '2026-10-12T14:00:00Z',
      }),
    } as Response);

    const adapter = new HttpOutboxAdapter('http://localhost:8000');
    const result = await adapter.getMessageDeliveryStatus('conv-1', 'msg-456');

    expect(result.messageId).toBe('msg-456');
    expect(result.status).toBe('PROCESSING_WORKER');
    expect(result.workerId).toBe('worker-1');
    expect(result.queue).toBe('conversation.llm_processing.queue');
  });

  it('should handle 404 tolerantly (RFC-10 fallback) by assuming simulated delivered state', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ detail: 'Not Found' }),
    } as Response);

    const adapter = new HttpOutboxAdapter('http://localhost:8000');
    const result = await adapter.getMessageDeliveryStatus('conv-1', 'msg-fallback');

    expect(result.messageId).toBe('msg-fallback');
    expect(result.status).toBe('COMPLETED');
    expect(result.isTerminal).toBe(true);
  });
});
