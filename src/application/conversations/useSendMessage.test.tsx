import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useSendMessage } from './useSendMessage';
import { container } from '@/infrastructure/container';
import { ConversationAggregate } from '@/domain/conversations/ConversationAggregate';
import { ConversationId } from '@/domain/conversations/ConversationId';
import { Message } from '@/domain/conversations/Message';

describe('useSendMessage hook', () => {
  let queryClient: QueryClient;
  const conversationId = 'conv-test-1';

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.restoreAllMocks();

    const initialConv = new ConversationAggregate(
      ConversationId.create(conversationId),
      'Test Chat',
      []
    );
    queryClient.setQueryData(['conversation', conversationId], initialConv);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('performs optimistic update and calls gateway with valid IdempotencyKey', async () => {
    const mockReturnMsg = new Message(
      'msg-real-1',
      'user',
      'Hola, quiero un café',
      new Date(),
      'confirmed'
    );
    const sendSpy = vi
      .spyOn(container.conversationGateway, 'sendMessage')
      .mockResolvedValue(mockReturnMsg);

    const { result } = renderHook(() => useSendMessage(conversationId), { wrapper });

    await act(async () => {
      result.current.mutate('Hola, quiero un café');
    });

    expect(sendSpy).toHaveBeenCalledTimes(1);
    const [calledConvId, calledContent, calledKey] = sendSpy.mock.calls[0];
    expect(calledConvId).toBe(conversationId);
    expect(calledContent).toBe('Hola, quiero un café');
    expect(calledKey).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('reverts optimistic update on network failure', async () => {
    vi.spyOn(container.conversationGateway, 'sendMessage').mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => useSendMessage(conversationId), { wrapper });

    await act(async () => {
      result.current.mutate('Mensaje que fallará');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const cachedConv = queryClient.getQueryData<ConversationAggregate>([
      'conversation',
      conversationId,
    ]);
    expect(cachedConv?.messages).toHaveLength(0);
  });
});
