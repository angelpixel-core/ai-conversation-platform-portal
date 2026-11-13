import {
  ConversationGatewayPort,
  CreateConversationOutput,
} from '@/domain/conversations/ConversationGatewayPort';
import { IdempotencyKey } from '@/domain/conversations/IdempotencyKey';

export interface CreateConversationCommandInput {
  title: string;
  idempotencyKey?: string;
}

export class CreateConversationUseCase {
  constructor(private readonly gateway: ConversationGatewayPort) {}

  async execute(input: CreateConversationCommandInput): Promise<CreateConversationOutput> {
    const title = input.title?.trim() || 'Nueva Conversación';
    const key = input.idempotencyKey
      ? IdempotencyKey.from(input.idempotencyKey)
      : IdempotencyKey.generate();

    return this.gateway.createConversation(title, key.value);
  }
}

