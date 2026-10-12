import { ConversationAggregate } from './ConversationAggregate';
import { Message } from './Message';

export interface CreateConversationOutput {
  id: string;
  title: string;
}

export interface ConversationGatewayPort {
  getConversation(id: string): Promise<ConversationAggregate>;
  createConversation(title: string, idempotencyKey: string): Promise<CreateConversationOutput>;
  sendMessage(conversationId: string, content: string, idempotencyKey: string): Promise<Message>;
}
