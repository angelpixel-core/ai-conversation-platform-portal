import { describe, it, expect } from 'vitest';
import {
  streamBufferReducer,
  initialStreamBufferState,
  StreamBufferAction,
} from './streamBufferReducer';

describe('streamBufferReducer', () => {
  it('returns initial state', () => {
    const state = streamBufferReducer(initialStreamBufferState, { type: 'RESET' });
    expect(state.status).toBe('IDLE');
    expect(state.accumulatedText).toBe('');
    expect(state.lastEventId).toBeNull();
    expect(state.tokensCount).toBe(0);
  });

  it('handles START action', () => {
    const state = streamBufferReducer(initialStreamBufferState, {
      type: 'START',
      conversationId: 'conv-1',
      tenantId: 'corp-acme',
    });
    expect(state.status).toBe('CONNECTING');
    expect(state.conversationId).toBe('conv-1');
    expect(state.tenantId).toBe('corp-acme');
  });

  it('handles APPEND_TOKEN and records TTFT on first token', () => {
    const connectingState = streamBufferReducer(initialStreamBufferState, {
      type: 'START',
      conversationId: 'conv-1',
      tenantId: 'corp-acme',
    });

    const tokenAction: StreamBufferAction = {
      type: 'APPEND_TOKEN',
      sequenceId: 1,
      text: 'Hola ',
      timestamp: Date.now(),
    };

    const state = streamBufferReducer(connectingState, tokenAction);
    expect(state.status).toBe('STREAMING');
    expect(state.accumulatedText).toBe('Hola ');
    expect(state.lastEventId).toBe(1);
    expect(state.tokensCount).toBe(1);
    expect(state.ttftMs).toBeGreaterThanOrEqual(0);
  });

  it('deduplicates tokens with sequenceId <= lastEventId', () => {
    let state = streamBufferReducer(initialStreamBufferState, {
      type: 'START',
      conversationId: 'conv-1',
      tenantId: 'corp-acme',
    });

    state = streamBufferReducer(state, {
      type: 'APPEND_TOKEN',
      sequenceId: 1,
      text: 'Hola ',
      timestamp: Date.now(),
    });

    state = streamBufferReducer(state, {
      type: 'APPEND_TOKEN',
      sequenceId: 1,
      text: 'Hola ',
      timestamp: Date.now(),
    });

    expect(state.accumulatedText).toBe('Hola ');
    expect(state.tokensCount).toBe(1);
  });

  it('handles RECONNECT action and increments reconnectCount', () => {
    let state = streamBufferReducer(initialStreamBufferState, {
      type: 'START',
      conversationId: 'conv-1',
      tenantId: 'corp-acme',
    });

    state = streamBufferReducer(state, {
      type: 'APPEND_TOKEN',
      sequenceId: 4,
      text: 'Texto',
      timestamp: Date.now(),
    });

    state = streamBufferReducer(state, { type: 'RECONNECT' });
    expect(state.status).toBe('RECONNECTING');
    expect(state.reconnectCount).toBe(1);
    expect(state.lastEventId).toBe(4);
  });

  it('handles COMPLETE action', () => {
    let state = streamBufferReducer(initialStreamBufferState, {
      type: 'START',
      conversationId: 'conv-1',
      tenantId: 'corp-acme',
    });

    state = streamBufferReducer(state, { type: 'COMPLETE' });
    expect(state.status).toBe('COMPLETED');
  });

  it('handles FAIL action', () => {
    let state = streamBufferReducer(initialStreamBufferState, {
      type: 'START',
      conversationId: 'conv-1',
      tenantId: 'corp-acme',
    });

    state = streamBufferReducer(state, {
      type: 'FAIL',
      error: 'Network disconnect',
    });
    expect(state.status).toBe('FAILED');
    expect(state.error).toBe('Network disconnect');
  });
});
