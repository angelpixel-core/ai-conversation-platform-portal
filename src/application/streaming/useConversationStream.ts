import { useReducer, useRef, useCallback } from 'react';
import {
  StreamingGateway,
  StreamTokenEvent,
} from '@/domain/streaming/StreamingGateway';
import { HttpStreamingGateway } from '@/infrastructure/api/HttpStreamingGateway';
import { MockStreamingGateway } from '@/infrastructure/api/MockStreamingGateway';
import {
  streamBufferReducer,
  initialStreamBufferState,
} from './streamBufferReducer';

export interface UseConversationStreamOptions {
  conversationId: string;
  tenantId: string;
  gateway?: StreamingGateway;
  autoReconnect?: boolean;
}

export function useConversationStream({
  conversationId,
  tenantId,
  gateway,
  autoReconnect = false,
}: UseConversationStreamOptions) {
  const [state, dispatch] = useReducer(
    streamBufferReducer,
    initialStreamBufferState
  );
  const abortControllerRef = useRef<AbortController | null>(null);

  const defaultGateway = useRef<StreamingGateway | null>(null);
  if (!defaultGateway.current) {
    const useMocks =
      process.env.NEXT_PUBLIC_USE_MOCKS === 'true' ||
      typeof window === 'undefined';
    defaultGateway.current = useMocks
      ? new MockStreamingGateway()
      : new HttpStreamingGateway();
  }

  const activeGateway = gateway || defaultGateway.current;

  const startStreamInternal = useCallback(
    async (fromEventId: number | null = null) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      if (fromEventId === null) {
        dispatch({ type: 'START', conversationId, tenantId });
      }

      try {
        await activeGateway.openStream(
          conversationId,
          tenantId,
          fromEventId,
          {
            onToken: (event: StreamTokenEvent) => {
              dispatch({
                type: 'APPEND_TOKEN',
                sequenceId: event.sequenceId,
                text: event.text,
                timestamp: Date.now(),
              });
            },
            onDone: () => {
              dispatch({ type: 'COMPLETE' });
            },
            onError: (err: Error) => {
              dispatch({ type: 'RECONNECT' });
              if (autoReconnect) {
                setTimeout(() => {
                  if (!controller.signal.aborted) {
                    startStreamInternal(state.lastEventId);
                  }
                }, 1000);
              }
            },
            onReconnect: () => {
              dispatch({ type: 'RECONNECT' });
            },
          },
          controller.signal
        );
      } catch (err: any) {
        if (!controller.signal.aborted) {
          dispatch({
            type: 'FAIL',
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    },
    [activeGateway, conversationId, tenantId, autoReconnect, state.lastEventId]
  );

  const startStream = useCallback(async () => {
    await startStreamInternal(null);
  }, [startStreamInternal]);

  const resumeStream = useCallback(async () => {
    await startStreamInternal(state.lastEventId);
  }, [startStreamInternal, state.lastEventId]);

  const abortStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    dispatch({ type: 'FAIL', error: 'Stream cancelado por el operador' });
  }, []);

  const resetStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    dispatch({ type: 'RESET' });
  }, []);

  return {
    ...state,
    isStreaming: state.status === 'STREAMING' || state.status === 'CONNECTING',
    isReconnecting: state.status === 'RECONNECTING',
    isCompleted: state.status === 'COMPLETED',
    startStream,
    resumeStream,
    abortStream,
    resetStream,
  };
}
