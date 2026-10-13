import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpStreamingGateway } from './HttpStreamingGateway';

describe('HttpStreamingGateway', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('delegates to openResilientStream with correct URL', async () => {
    const ssePayload = 'id: 1\ndata: Prueba\n\ndata: [DONE]\n\n';
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(ssePayload));
        controller.close();
      },
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      body: stream,
    });
    vi.stubGlobal('fetch', mockFetch);

    const gateway = new HttpStreamingGateway('http://localhost:8000');
    const tokens: { sequenceId: number; text: string }[] = [];

    await gateway.openStream('conv-1', 'corp-acme', null, {
      onToken: (t) => tokens.push(t),
      onDone: vi.fn(),
      onError: vi.fn(),
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8000/conversations/conv-1/stream',
      expect.anything()
    );
    expect(tokens).toEqual([{ sequenceId: 1, text: 'Prueba' }]);
  });

  it('falls back to mock if fetch fails with connection refused in dev mode', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Failed to fetch'))
    );

    const gateway = new HttpStreamingGateway('http://localhost:8000');
    const tokens: { sequenceId: number; text: string }[] = [];
    let isDone = false;

    await gateway.openStream('conv-1', 'corp-acme', null, {
      onToken: (t) => tokens.push(t),
      onDone: () => {
        isDone = true;
      },
      onError: vi.fn(),
    });

    expect(tokens.length).toBeGreaterThan(0);
    expect(isDone).toBe(true);
  });
});
