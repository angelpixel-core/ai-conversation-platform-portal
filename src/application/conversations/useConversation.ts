import { useQuery } from '@tanstack/react-query';
import { container } from '@/infrastructure/container';
import { ConversationAggregate } from '@/domain/conversations/ConversationAggregate';
import { GetConversationUseCase } from './queries/GetConversationUseCase';

export const CONVERSATION_QUERY_KEY = (id: string) => ['conversation', id] as const;

export function useConversation(conversationId: string) {
  const useCase = new GetConversationUseCase(container.conversationGateway);

  return useQuery<ConversationAggregate>({
    queryKey: CONVERSATION_QUERY_KEY(conversationId),
    queryFn: () => useCase.execute(conversationId),
    enabled: Boolean(conversationId),
    staleTime: 5000,
  });
}
