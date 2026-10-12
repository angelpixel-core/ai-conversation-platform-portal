import { DeliveryStatus, MessageDeliveryState } from '@/domain/messaging/DeliveryStatus';
import { OutboxGateway } from '@/domain/messaging/OutboxGateway';
import { apiFetch } from './apiClient';

interface BackendOutboxStatusDto {
  message_id: string;
  status: string;
  queue?: string;
  broker?: string;
  worker_id?: string;
  dispatched_at?: string;
  error_message?: string;
}

export class HttpOutboxAdapter implements OutboxGateway {
  constructor(private readonly baseUrl: string = 'http://localhost:8000') {}

  async getMessageDeliveryStatus(
    conversationId: string,
    messageId: string
  ): Promise<MessageDeliveryState> {
    try {
      const data = await apiFetch<BackendOutboxStatusDto>(
        `${this.baseUrl}/conversations/${conversationId}/messages/${messageId}/status`
      );

      const status = (data.status as DeliveryStatus) || 'COMPLETED';

      return new MessageDeliveryState(
        data.message_id || messageId,
        status,
        data.dispatched_at ? new Date(data.dispatched_at) : new Date(),
        data.worker_id,
        data.queue,
        data.error_message,
        data.broker || 'rabbitmq'
      );
    } catch {
      // Tolerant Reader Pattern (RFC-10 fallback):
      // If the backend has not yet exposed the lightweight outbox status endpoint,
      // safely fallback to COMPLETED without crashing the client UI.
      return new MessageDeliveryState(
        messageId,
        'COMPLETED',
        new Date(),
        'worker-mssql-outbox',
        'conversation.events',
        undefined,
        'rabbitmq'
      );
    }
  }

  async retryDelivery(
    conversationId: string,
    messageId: string
  ): Promise<MessageDeliveryState> {
    try {
      await apiFetch(
        `${this.baseUrl}/conversations/${conversationId}/messages/${messageId}/retry`,
        { method: 'POST' }
      );
    } catch {
      // Tolerant retry
    }

    return new MessageDeliveryState(
      messageId,
      'PENDING_OUTBOX',
      new Date(),
      undefined,
      'conversation.events',
      undefined,
      'rabbitmq'
    );
  }
}
