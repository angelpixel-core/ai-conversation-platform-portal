import { StreamChunk } from './StreamChunk';

export type StreamStatus =
  | 'IDLE'
  | 'CONNECTING'
  | 'STREAMING'
  | 'RECONNECTING'
  | 'COMPLETED'
  | 'FAILED';

export interface StreamSessionProps {
  conversationId: string;
  tenantId: string;
  status?: StreamStatus;
  lastEventId?: number | null;
  accumulatedText?: string;
  reconnectCount?: number;
  errorMessage?: string | null;
}

export class StreamSession {
  readonly conversationId: string;
  readonly tenantId: string;
  private _status: StreamStatus;
  private _lastEventId: number | null;
  private _accumulatedText: string;
  private _reconnectCount: number;
  private _errorMessage: string | null;
  private _chunks: StreamChunk[] = [];

  constructor(props: StreamSessionProps) {
    this.conversationId = props.conversationId;
    this.tenantId = props.tenantId;
    this._status = props.status ?? 'IDLE';
    this._lastEventId = props.lastEventId ?? null;
    this._accumulatedText = props.accumulatedText ?? '';
    this._reconnectCount = props.reconnectCount ?? 0;
    this._errorMessage = props.errorMessage ?? null;
  }

  static create(conversationId: string, tenantId: string): StreamSession {
    return new StreamSession({ conversationId, tenantId });
  }

  get status(): StreamStatus {
    return this._status;
  }

  get lastEventId(): number | null {
    return this._lastEventId;
  }

  get accumulatedText(): string {
    return this._accumulatedText;
  }

  get reconnectCount(): number {
    return this._reconnectCount;
  }

  get errorMessage(): string | null {
    return this._errorMessage;
  }

  get isCompleted(): boolean {
    return this._status === 'COMPLETED';
  }

  get isStreaming(): boolean {
    return this._status === 'STREAMING' || this._status === 'CONNECTING';
  }

  get isReconnecting(): boolean {
    return this._status === 'RECONNECTING';
  }

  get chunks(): readonly StreamChunk[] {
    return this._chunks;
  }

  markConnecting(): void {
    this._status = 'CONNECTING';
    this._errorMessage = null;
  }

  markReconnecting(): void {
    this._status = 'RECONNECTING';
    this._reconnectCount += 1;
  }

  markCompleted(): void {
    this._status = 'COMPLETED';
  }

  markFailed(error: string): void {
    this._status = 'FAILED';
    this._errorMessage = error;
  }

  appendChunk(chunk: StreamChunk): boolean {
    if (chunk.isDone) {
      this.markCompleted();
      return true;
    }

    // Invariant: Sequence number must strictly advance to prevent duplicate tokens on recovery
    if (this._lastEventId !== null && chunk.sequenceId <= this._lastEventId) {
      return false; // Duplicate or out-of-order chunk ignored
    }

    this._chunks.push(chunk);
    this._accumulatedText += chunk.text;
    this._lastEventId = chunk.sequenceId;
    this._status = 'STREAMING';
    return true;
  }
}
