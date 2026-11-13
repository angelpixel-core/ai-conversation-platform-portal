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
  { sequenceId: 1, text: 'Respuesta ' },
  { sequenceId: 2, text: 'simulada ' },
  { sequenceId: 3, text: 'del ' },
  { sequenceId: 4, text: 'asistente ' },
  { sequenceId: 5, text: 'IA ' },
  { sequenceId: 6, text: 'para ' },
  { sequenceId: 7, text: 'la ' },
  { sequenceId: 8, text: 'infraestructura ' },
  { sequenceId: 9, text: 'cloud ' },
  { sequenceId: 10, text: 'de ' },
  { sequenceId: 11, text: 'la ' },
  { sequenceId: 12, text: 'empresa.' },
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
