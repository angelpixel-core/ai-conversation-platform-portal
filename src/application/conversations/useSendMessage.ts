import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IdempotencyKey } from '@/domain/conversations/IdempotencyKey';
import { container } from '@/infrastructure/container';
import { ConversationAggregate } from '@/domain/conversations/ConversationAggregate';
import { Message } from '@/domain/conversations/Message';
import { SendMessageUseCase } from './commands/SendMessageUseCase';

export type SendMessageVariables = string | { content: string; idempotencyKey?: string };

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  const useCase = new SendMessageUseCase(container.conversationGateway);

  return useMutation({
    mutationFn: async (vars: SendMessageVariables) => {
      const content = typeof vars === 'string' ? vars : vars.content;
      const idempotencyKey = typeof vars === 'string' ? undefined : vars.idempotencyKey;
      return useCase.execute({ conversationId, content, idempotencyKey });
    },
    onMutate: async (vars: SendMessageVariables) => {
      const content = typeof vars === 'string' ? vars : vars.content;
      const idempotencyKey = typeof vars === 'string' ? undefined : vars.idempotencyKey;

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
          'optimistic',
          idempotencyKey || IdempotencyKey.generate().value
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
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['conversation', conversationId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
    },
  });
}
