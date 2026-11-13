import { ConversationGatewayPort } from '@/domain/conversations/ConversationGatewayPort';
import { ConversationAggregate } from '@/domain/conversations/ConversationAggregate';

export class GetConversationUseCase {
  constructor(private readonly gateway: ConversationGatewayPort) {}

  async execute(conversationId: string): Promise<ConversationAggregate> {
    if (!conversationId || conversationId.trim().length === 0) {
      throw new Error('El ID de conversación es requerido.');
    }

    return this.gateway.getConversation(conversationId);
  }
}

