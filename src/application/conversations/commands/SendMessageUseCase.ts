import { ConversationGatewayPort } from '@/domain/conversations/ConversationGatewayPort';
import { IdempotencyKey } from '@/domain/conversations/IdempotencyKey';
import { Message } from '@/domain/conversations/Message';

export interface SendMessageCommandInput {
  conversationId: string;
  content: string;
  idempotencyKey?: string;
}

export class SendMessageUseCase {
  constructor(private readonly gateway: ConversationGatewayPort) {}

  async execute(input: SendMessageCommandInput): Promise<Message> {
    if (!input.content || input.content.trim().length === 0) {
      throw new Error('El contenido del mensaje no puede estar vacío.');
    }

    const key = input.idempotencyKey
      ? IdempotencyKey.from(input.idempotencyKey)
      : IdempotencyKey.generate();

    return this.gateway.sendMessage(input.conversationId, input.content.trim(), key.value);
  }
}

