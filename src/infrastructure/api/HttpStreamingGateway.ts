import {
  StreamingGateway,
  StreamCallbacks,
} from '@/domain/streaming/StreamingGateway';
import { openResilientStream } from '@/infrastructure/sse/resilientEventSource';
import { MockStreamingGateway } from './MockStreamingGateway';

export class HttpStreamingGateway implements StreamingGateway {
  private baseUrl: string;
  private fallbackMock: MockStreamingGateway;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    this.fallbackMock = new MockStreamingGateway({ tokenDelayMs: 25 });
  }

  async openStream(
    conversationId: string,
    tenantId: string,
    lastEventId: number | null,
    callbacks: StreamCallbacks,
    signal?: AbortSignal
  ): Promise<void> {
    const url = `${this.baseUrl}/conversations/${conversationId}/stream`;

    let streamError: Error | null = null;

    try {
      await openResilientStream(
        url,
        tenantId,
        lastEventId,
        {
          onToken: callbacks.onToken,
          onDone: callbacks.onDone,
          onError: (err) => {
            streamError = err;
          },
          onReconnect: callbacks.onReconnect,
        },
        signal
      );
    } catch (err: any) {
      streamError = err instanceof Error ? err : new Error(String(err));
    }

    if (streamError) {
      // In development or test mode, fall back gracefully to mock
      if (
        process.env.NODE_ENV !== 'production' ||
        process.env.NEXT_PUBLIC_USE_MOCKS === 'true'
      ) {
        await this.fallbackMock.openStream(
          conversationId,
          tenantId,
          lastEventId,
          callbacks,
          signal
        );
        return;
      }
      callbacks.onError(streamError);
    }
  }
}
