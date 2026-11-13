import { useMutation, useQueryClient } from '@tanstack/react-query';
import { container } from '@/infrastructure/container';
import { CreateConversationUseCase } from './commands/CreateConversationUseCase';

export function useCreateConversation() {
  const queryClient = useQueryClient();
  const useCase = new CreateConversationUseCase(container.conversationGateway);

  return useMutation({
    mutationFn: async ({ title, idempotencyKey }: { title: string; idempotencyKey?: string }) => {
      return useCase.execute({ title, idempotencyKey });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', data.id] });
    },
  });
}

