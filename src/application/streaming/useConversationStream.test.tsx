import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConversationStream } from './useConversationStream';
import { MockStreamingGateway } from '@/infrastructure/api/MockStreamingGateway';

describe('useConversationStream (Application Hook)', () => {
  it('initializes with idle status and empty text', () => {
    const gateway = new MockStreamingGateway({ tokenDelayMs: 5 });
    const { result } = renderHook(() =>
      useConversationStream({
        conversationId: 'conv-1',
        tenantId: 'corp-acme',
        gateway,
      })
    );

    expect(result.current.status).toBe('IDLE');
    expect(result.current.accumulatedText).toBe('');
    expect(result.current.isStreaming).toBe(false);
  });

  it('streams tokens and completes successfully', async () => {
    const gateway = new MockStreamingGateway({ tokenDelayMs: 5 });
    const { result } = renderHook(() =>
      useConversationStream({
        conversationId: 'conv-1',
        tenantId: 'corp-acme',
        gateway,
      })
    );

    await act(async () => {
      await result.current.startStream();
    });

    expect(result.current.status).toBe('COMPLETED');
    expect(result.current.accumulatedText.length).toBeGreaterThan(0);
    expect(result.current.tokensCount).toBeGreaterThan(5);
    expect(result.current.lastEventId).toBeGreaterThan(0);
  });

  it('handles simulated network drop and allows recovery with lastEventId', async () => {
    const gateway = new MockStreamingGateway({
      tokenDelayMs: 5,
      dropAtSequence: 4,
    });
    const { result } = renderHook(() =>
      useConversationStream({
        conversationId: 'conv-1',
        tenantId: 'corp-acme',
        gateway,
      })
    );

    // 1. Initial stream drops at sequence 4
    await act(async () => {
      await result.current.startStream();
    });

    expect(result.current.lastEventId).toBe(4);
    expect(result.current.status).toBe('RECONNECTING');
    const textBeforeRecovery = result.current.accumulatedText;

    // 2. Clear drop setting on gateway and resume stream with Last-Event-ID
    gateway.setDropAtSequence(null);
    await act(async () => {
      await result.current.resumeStream();
    });

    expect(result.current.status).toBe('COMPLETED');
    expect(result.current.accumulatedText.startsWith(textBeforeRecovery)).toBe(true);
    expect(result.current.accumulatedText.length).toBeGreaterThan(textBeforeRecovery.length);
  });
});
