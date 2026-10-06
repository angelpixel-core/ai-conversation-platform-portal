import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IdempotencyKey } from '@/domain/conversations/IdempotencyKey';
import { container } from '@/infrastructure/container';
import { ConversationAggregate } from '@/domain/conversations/ConversationAggregate';
import { Message } from '@/domain/conversations/Message';

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const key = IdempotencyKey.generate();
      return container.conversationGateway.sendMessage(conversationId, content, key.value);
    },
    onMutate: async (content: string) => {
      await queryClient.cancelQueries({ queryKey: ['conversation', conversationId] });
      const previous = queryClient.getQueryData<ConversationAggregate>([
        'conversation',
        conversationId,
      ]);

      if (previous) {
        const optimisticMsg = new Message(
          'temp-' + Date.now(),
          'user',
          content,
          new Date(),
          'optimistic'
        );
        const updated = new ConversationAggregate(
          previous.id,
          previous.title,
          [...previous.messages, optimisticMsg]
        );
        queryClient.setQueryData(['conversation', conversationId], updated);
      }

      return { previous };
    },
    onError: (_err, _content, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['conversation', conversationId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
    },
  });
}
