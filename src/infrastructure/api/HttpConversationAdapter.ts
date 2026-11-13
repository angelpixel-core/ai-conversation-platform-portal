import {
  ConversationGatewayPort,
  CreateConversationOutput,
} from '@/domain/conversations/ConversationGatewayPort';
import { ConversationAggregate } from '@/domain/conversations/ConversationAggregate';
import { ConversationId } from '@/domain/conversations/ConversationId';
import { Message, MessageRole } from '@/domain/conversations/Message';
import {
  IdempotencyConflictError,
  TurnInvariantError,
} from '@/domain/conversations/ConversationErrors';
import { apiFetch, ApiError } from './apiClient';

export interface RawMessageResponse {
  id?: string;
  message_id?: string;
  conversation_id?: string;
  role?: string;
  content?: string;
  created_at?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface RawConversationResponse {
  id?: string;
  conversation_id?: string;
  title?: string;
  messages?: RawMessageResponse[];
  [key: string]: unknown;
}

export class HttpConversationAdapter implements ConversationGatewayPort {
  constructor(private readonly baseUrl: string = 'http://localhost:8000') {}

  private resolveUrl(endpoint: string): string {
    if (this.baseUrl && this.baseUrl.startsWith('http')) {
      return `${this.baseUrl}${endpoint}`;
    }
    return endpoint;
  }

  private handleError(error: unknown): never {
    if (error instanceof ApiError) {
      if (error.status === 409) {
        throw new IdempotencyConflictError(error.message);
      }
      if (
        error.status === 400 &&
        (error.message.includes('assistant responds') ||
          error.message.includes('DomainInvariantViolation') ||
          error.message.includes('turn'))
      ) {
        throw new TurnInvariantError(error.message);
      }
    }
    throw error;
  }

  async getConversation(id: string): Promise<ConversationAggregate> {
    try {
      const url = this.resolveUrl(`/conversations/${id}`);
      let raw: RawConversationResponse;
      try {
        raw = await apiFetch<RawConversationResponse>(url);
      } catch (networkErr) {
        if (typeof window !== 'undefined' && this.baseUrl.startsWith('http')) {
          raw = await apiFetch<RawConversationResponse>(`/conversations/${id}`);
        } else {
          throw networkErr;
        }
      }

      const conversationId = raw.id || raw.conversation_id || id;
      const title = raw.title || 'Conversación Activa';
      const messages = (raw.messages || []).map((m, idx) => {
        const msgId = m.id || m.message_id || `msg-${idx}`;
        const role = (m.role as MessageRole) || 'user';
        const content = m.content || '';
        const dateStr = m.created_at || m.createdAt;
        const createdAt = dateStr ? new Date(dateStr) : new Date();
        return new Message(msgId, role, content, createdAt, 'confirmed');
      });

      return new ConversationAggregate(ConversationId.create(conversationId), title, messages);
    } catch (err) {
      this.handleError(err);
    }
  }

  async createConversation(
    title: string,
    idempotencyKey: string
  ): Promise<CreateConversationOutput> {
    try {
      const url = this.resolveUrl('/conversations');
      const payload = { title };
      const headers = {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      };

      let raw: RawConversationResponse;
      try {
        raw = await apiFetch<RawConversationResponse>(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
      } catch (networkErr) {
        if (typeof window !== 'undefined' && this.baseUrl.startsWith('http')) {
          raw = await apiFetch<RawConversationResponse>('/conversations', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
          });
        } else {
          throw networkErr;
        }
      }

      const id = raw.id || raw.conversation_id || 'conv-' + Date.now();
      return { id, title: raw.title || title };
    } catch (err) {
      this.handleError(err);
    }
  }

  async sendMessage(
    conversationId: string,
    content: string,
    idempotencyKey: string
  ): Promise<Message> {
    try {
      const url = this.resolveUrl(`/conversations/${conversationId}/messages`);
      const payload = { content };
      const headers = {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      };

      let raw: RawMessageResponse;
      try {
        raw = await apiFetch<RawMessageResponse>(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
      } catch (networkErr) {
        if (typeof window !== 'undefined' && this.baseUrl.startsWith('http')) {
          raw = await apiFetch<RawMessageResponse>(`/conversations/${conversationId}/messages`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
          });
        } else {
          throw networkErr;
        }
      }

      const msgId = raw.id || raw.message_id || 'msg-' + Date.now();
      const role = (raw.role as MessageRole) || 'user';
      const body = raw.content ?? content;
      const dateStr = raw.created_at || raw.createdAt;
      const createdAt = dateStr ? new Date(dateStr) : new Date();

      return new Message(msgId, role, body, createdAt, 'confirmed', idempotencyKey);
    } catch (err) {
      this.handleError(err);
    }
  }
}
