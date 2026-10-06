import {
  ConversationGatewayPort,
  CreateConversationOutput,
} from '@/domain/conversations/ConversationGatewayPort';
import { ConversationAggregate } from '@/domain/conversations/ConversationAggregate';
import { ConversationId } from '@/domain/conversations/ConversationId';
import { Message, MessageRole } from '@/domain/conversations/Message';
import { apiFetch } from './apiClient';

interface RawMessageResponse {
  id?: string;
  role: string;
  content: string;
  created_at?: string;
}

interface RawConversationResponse {
  id: string;
  title: string;
  messages?: RawMessageResponse[];
}

export class HttpConversationAdapter implements ConversationGatewayPort {
  constructor(private readonly baseUrl: string = 'http://localhost:8000') {}

  async getConversation(id: string): Promise<ConversationAggregate> {
    const raw = await apiFetch<RawConversationResponse>(`${this.baseUrl}/conversations/${id}`);
    const messages = (raw.messages || []).map(
      (m, idx) =>
        new Message(
          m.id || `msg-${idx}`,
          m.role as MessageRole,
          m.content,
          m.created_at ? new Date(m.created_at) : new Date(),
          'confirmed'
        )
    );
    return new ConversationAggregate(ConversationId.create(raw.id), raw.title, messages);
  }

  async createConversation(
    title: string,
    idempotencyKey: string
  ): Promise<CreateConversationOutput> {
    const raw = await apiFetch<CreateConversationOutput>(`${this.baseUrl}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({ title }),
    });

    return { id: raw.id, title: raw.title };
  }

  async sendMessage(
    conversationId: string,
    content: string,
    idempotencyKey: string
  ): Promise<Message> {
    const raw = await apiFetch<RawMessageResponse>(
      `${this.baseUrl}/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({ content }),
      }
    );

    return new Message(
      raw.id || 'msg-' + Date.now(),
      raw.role as MessageRole,
      raw.content,
      raw.created_at ? new Date(raw.created_at) : new Date(),
      'confirmed',
      idempotencyKey
    );
  }
}
