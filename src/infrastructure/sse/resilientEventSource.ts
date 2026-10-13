import { StreamCallbacks } from '@/domain/streaming/StreamingGateway';

export async function openResilientStream(
  url: string,
  tenantId: string,
  lastEventId: number | null,
  handlers: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const headers: Record<string, string> = {
    Accept: 'text/event-stream',
    'X-Tenant-Id': tenantId,
  };

  if (lastEventId !== null && lastEventId > 0) {
    headers['Last-Event-ID'] = String(lastEventId);
  }

  try {
    const response = await fetch(url, { headers, signal });

    if (!response.ok) {
      throw new Error(`SSE request failed with status ${response.status}: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('ReadableStream not supported or empty body');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let currentId = 0;

    while (true) {
      if (signal?.aborted) {
        return;
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line || line.startsWith(':')) {
          // Empty line or keep-alive comment, ignore
          continue;
        }

        if (line.startsWith('id:')) {
          const rawId = line.slice(3).trim();
          const parsed = parseInt(rawId, 10);
          if (!Number.isNaN(parsed)) {
            currentId = parsed;
          }
        } else if (line.startsWith('data:')) {
          // Standard SSE spec: strip single leading space if present
          let payload = line.slice(5);
          if (payload.startsWith(' ')) {
            payload = payload.slice(1);
          }

          if (payload.trim() === '[DONE]') {
            handlers.onDone();
            return;
          }
          handlers.onToken({
            sequenceId: currentId,
            text: payload,
          });
        }
      }
    }

    handlers.onDone();
  } catch (err: any) {
    if (signal?.aborted) {
      return;
    }
    handlers.onError(err instanceof Error ? err : new Error(String(err)));
  }
}
