import {
  StreamingGateway,
  StreamCallbacks,
} from '@/domain/streaming/StreamingGateway';

export interface MockStreamingGatewayOptions {
  tokenDelayMs?: number;
  dropAtSequence?: number | null;
  seedTokens?: { sequenceId: number; text: string }[];
}

const DEFAULT_SEED_TOKENS = [
  { sequenceId: 1, text: 'Para ' },
  { sequenceId: 2, text: 'un ' },
  { sequenceId: 3, text: 'espresso ' },
  { sequenceId: 4, text: 'perfecto, ' },
  { sequenceId: 5, text: 'utilizamos ' },
  { sequenceId: 6, text: '18g ' },
  { sequenceId: 7, text: 'de ' },
  { sequenceId: 8, text: 'café ' },
  { sequenceId: 9, text: 'Geisha ' },
  { sequenceId: 10, text: 'molienda ' },
  { sequenceId: 11, text: 'fina ' },
  { sequenceId: 12, text: 'a ' },
  { sequenceId: 13, text: '9 ' },
  { sequenceId: 14, text: 'bares ' },
  { sequenceId: 15, text: 'de ' },
  { sequenceId: 16, text: 'presión ' },
  { sequenceId: 17, text: 'durante ' },
  { sequenceId: 18, text: '26 ' },
  { sequenceId: 19, text: 'segundos.' },
];

export class MockStreamingGateway implements StreamingGateway {
  private tokenDelayMs: number;
  private dropAtSequence: number | null;
  private seedTokens: { sequenceId: number; text: string }[];

  constructor(options: MockStreamingGatewayOptions = {}) {
    this.tokenDelayMs = options.tokenDelayMs ?? 40;
    this.dropAtSequence = options.dropAtSequence ?? null;
    this.seedTokens = options.seedTokens ?? DEFAULT_SEED_TOKENS;
  }

  setDropAtSequence(seq: number | null): void {
    this.dropAtSequence = seq;
  }

  async openStream(
    _conversationId: string,
    _tenantId: string,
    lastEventId: number | null,
    callbacks: StreamCallbacks,
    signal?: AbortSignal
  ): Promise<void> {
    const startSequence = lastEventId !== null && lastEventId > 0 ? lastEventId + 1 : 1;
    const tokensToEmit = this.seedTokens.filter((t) => t.sequenceId >= startSequence);

    for (const token of tokensToEmit) {
      if (signal?.aborted) {
        return;
      }

      // Check for simulated network drop
      if (this.dropAtSequence !== null && token.sequenceId === this.dropAtSequence) {
        callbacks.onToken(token);
        // Emulate sudden connection failure immediately after this token
        callbacks.onError(
          new Error(`Simulated network drop at sequence #${this.dropAtSequence}`)
        );
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, this.tokenDelayMs));

      if (signal?.aborted) {
        return;
      }

      callbacks.onToken(token);
    }

    callbacks.onDone();
  }
}
