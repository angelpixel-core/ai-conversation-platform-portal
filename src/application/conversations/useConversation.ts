import { useQuery } from '@tanstack/react-query';
import { container } from '@/infrastructure/container';
import { ConversationAggregate } from '@/domain/conversations/ConversationAggregate';

export const CONVERSATION_QUERY_KEY = (id: string) => ['conversation', id] as const;

export function useConversation(conversationId: string) {
  return useQuery<ConversationAggregate>({
    queryKey: CONVERSATION_QUERY_KEY(conversationId),
    queryFn: () => container.conversationGateway.getConversation(conversationId),
    enabled: Boolean(conversationId),
    staleTime: 5000,
  });
}
