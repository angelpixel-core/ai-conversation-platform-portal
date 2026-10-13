import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openResilientStream } from './resilientEventSource';

describe('openResilientStream (Infrastructure SSE)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('injects Accept, X-Tenant-Id, and Last-Event-ID headers into fetch', async () => {
    const ssePayload = 'id: 1\ndata: Hola\n\nid: 2\ndata:  mundo\n\ndata: [DONE]\n\n';
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(ssePayload));
        controller.close();
      },
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: stream,
    });
    vi.stubGlobal('fetch', mockFetch);

    const receivedTokens: { sequenceId: number; text: string }[] = [];
    let isDone = false;

    await openResilientStream(
      'http://localhost:8000/conversations/conv-1/stream',
      'corp-acme',
      4,
      {
        onToken: (tok) => receivedTokens.push(tok),
        onDone: () => {
          isDone = true;
        },
        onError: vi.fn(),
      }
    );

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8000/conversations/conv-1/stream',
      expect.objectContaining({
        headers: {
          Accept: 'text/event-stream',
          'X-Tenant-Id': 'corp-acme',
          'Last-Event-ID': '4',
        },
      })
    );

    expect(receivedTokens).toEqual([
      { sequenceId: 1, text: 'Hola' },
      { sequenceId: 2, text: ' mundo' },
    ]);
    expect(isDone).toBe(true);
  });

  it('omits Last-Event-ID when null or 0', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      body: stream,
    });
    vi.stubGlobal('fetch', mockFetch);

    await openResilientStream(
      'http://localhost:8000/stream',
      'corp-acme',
      null,
      {
        onToken: vi.fn(),
        onDone: vi.fn(),
        onError: vi.fn(),
      }
    );

    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers['Last-Event-ID']).toBeUndefined();
    expect(headers['X-Tenant-Id']).toBe('corp-acme');
  });

  it('triggers onError if fetch returns non-200 status', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    });
    vi.stubGlobal('fetch', mockFetch);

    const onError = vi.fn();
    await openResilientStream(
      'http://localhost:8000/stream',
      'corp-acme',
      null,
      {
        onToken: vi.fn(),
        onDone: vi.fn(),
        onError,
      }
    );

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(onError.mock.calls[0][0].message).toContain('503');
  });
});
