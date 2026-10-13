import { describe, it, expect } from 'vitest';
import { StreamSession } from './StreamSession';
import { StreamChunk } from './StreamChunk';

describe('StreamSession Aggregate', () => {
  it('initializes in IDLE state', () => {
    const session = StreamSession.create('conv-stream-1', 'corp-acme');

    expect(session.conversationId).toBe('conv-stream-1');
    expect(session.tenantId).toBe('corp-acme');
    expect(session.status).toBe('IDLE');
    expect(session.accumulatedText).toBe('');
    expect(session.lastEventId).toBeNull();
    expect(session.reconnectCount).toBe(0);
  });

  it('progresses to STREAMING on first chunk and accumulates text', () => {
    const session = StreamSession.create('conv-stream-1', 'corp-acme');
    session.markConnecting();
    expect(session.status).toBe('CONNECTING');

    session.appendChunk(new StreamChunk({ sequenceId: 1, text: 'Hola ' }));
    expect(session.status).toBe('STREAMING');
    expect(session.accumulatedText).toBe('Hola ');
    expect(session.lastEventId).toBe(1);

    session.appendChunk(new StreamChunk({ sequenceId: 2, text: 'mundo!' }));
    expect(session.accumulatedText).toBe('Hola mundo!');
    expect(session.lastEventId).toBe(2);
  });

  it('ignores duplicate or out-of-order chunks (resilient recovery invariant)', () => {
    const session = StreamSession.create('conv-stream-1', 'corp-acme');
    session.appendChunk(new StreamChunk({ sequenceId: 1, text: 'Hola ' }));
    session.appendChunk(new StreamChunk({ sequenceId: 2, text: 'mundo ' }));

    // Replay of chunk 1 or 2 should be rejected to prevent duplicated text
    session.appendChunk(new StreamChunk({ sequenceId: 2, text: 'mundo ' }));
    session.appendChunk(new StreamChunk({ sequenceId: 1, text: 'Hola ' }));

    expect(session.accumulatedText).toBe('Hola mundo ');
    expect(session.lastEventId).toBe(2);
  });

  it('handles reconnection state transition and preserves state', () => {
    const session = StreamSession.create('conv-stream-1', 'corp-acme');
    session.appendChunk(new StreamChunk({ sequenceId: 4, text: 'seguridad ' }));
    expect(session.lastEventId).toBe(4);

    session.markReconnecting();
    expect(session.status).toBe('RECONNECTING');
    expect(session.reconnectCount).toBe(1);

    // Reconnecting stream resumes with sequenceId 5
    session.appendChunk(new StreamChunk({ sequenceId: 5, text: 'establece ' }));
    expect(session.status).toBe('STREAMING');
    expect(session.accumulatedText).toBe('seguridad establece ');
    expect(session.lastEventId).toBe(5);
  });

  it('completes session when terminal chunk is received', () => {
    const session = StreamSession.create('conv-stream-1', 'corp-acme');
    session.appendChunk(new StreamChunk({ sequenceId: 1, text: 'Fin' }));
    session.appendChunk(new StreamChunk({ sequenceId: 2, text: '', isDone: true }));

    expect(session.status).toBe('COMPLETED');
    expect(session.isCompleted).toBe(true);
  });

  it('records failure with error message', () => {
    const session = StreamSession.create('conv-stream-1', 'corp-acme');
    session.markFailed('Network timeout');

    expect(session.status).toBe('FAILED');
    expect(session.errorMessage).toBe('Network timeout');
  });
});
