import { StreamStatus } from '@/domain/streaming/StreamSession';

export interface StreamBufferState {
  conversationId: string;
  tenantId: string;
  status: StreamStatus;
  accumulatedText: string;
  lastEventId: number | null;
  tokensCount: number;
  startTime: number | null;
  ttftMs: number | null;
  reconnectCount: number;
  error: string | null;
}

export const initialStreamBufferState: StreamBufferState = {
  conversationId: '',
  tenantId: '',
  status: 'IDLE',
  accumulatedText: '',
  lastEventId: null,
  tokensCount: 0,
  startTime: null,
  ttftMs: null,
  reconnectCount: 0,
  error: null,
};

export type StreamBufferAction =
  | { type: 'START'; conversationId: string; tenantId: string }
  | {
      type: 'APPEND_TOKEN';
      sequenceId: number;
      text: string;
      timestamp?: number;
    }
  | { type: 'RECONNECT' }
  | { type: 'COMPLETE' }
  | { type: 'FAIL'; error: string }
  | { type: 'RESET' };

export function streamBufferReducer(
  state: StreamBufferState,
  action: StreamBufferAction
): StreamBufferState {
  switch (action.type) {
    case 'START':
      return {
        ...initialStreamBufferState,
        conversationId: action.conversationId,
        tenantId: action.tenantId,
        status: 'CONNECTING',
        startTime: Date.now(),
      };

    case 'APPEND_TOKEN': {
      // Deduplicate: ignore if sequenceId <= lastEventId
      if (state.lastEventId !== null && action.sequenceId <= state.lastEventId) {
        return state;
      }

      const now = action.timestamp ?? Date.now();
      const ttftMs =
        state.ttftMs === null && state.startTime !== null
          ? Math.max(0, now - state.startTime)
          : state.ttftMs;

      return {
        ...state,
        status: 'STREAMING',
        accumulatedText: state.accumulatedText + action.text,
        lastEventId: action.sequenceId,
        tokensCount: state.tokensCount + 1,
        ttftMs,
        error: null,
      };
    }

    case 'RECONNECT':
      return {
        ...state,
        status: 'RECONNECTING',
        reconnectCount: state.reconnectCount + 1,
      };

    case 'COMPLETE':
      return {
        ...state,
        status: 'COMPLETED',
      };

    case 'FAIL':
      return {
        ...state,
        status: 'FAILED',
        error: action.error,
      };

    case 'RESET':
      return initialStreamBufferState;

    default:
      return state;
  }
}
