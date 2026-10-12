import { DeliveryStatus, DeliveryTransitionOptions, MessageDeliveryState } from '@/domain/messaging/DeliveryStatus';
import { OutboxGateway } from '@/domain/messaging/OutboxGateway';

export class MockOutboxGateway implements OutboxGateway {
  private cache = new Map<string, MessageDeliveryState>();

  private getKey(conversationId: string, messageId: string): string {
    return `${conversationId}:${messageId}`;
  }

  setStatus(
    conversationId: string,
    messageId: string,
    status: DeliveryStatus,
    options?: DeliveryTransitionOptions
  ): void {
    const key = this.getKey(conversationId, messageId);
    const existing = this.cache.get(key);
    if (existing) {
      this.cache.set(key, existing.transitionTo(status, options));
    } else {
      this.cache.set(
        key,
        new MessageDeliveryState(
          messageId,
          status,
          new Date(),
          options?.workerId ?? 'worker-node-alpha',
          options?.queue ?? 'conversation.llm_processing.queue',
          options?.errorMessage,
          options?.broker ?? 'rabbitmq'
        )
      );
    }
  }

  async getMessageDeliveryStatus(
    conversationId: string,
    messageId: string
  ): Promise<MessageDeliveryState> {
    const key = this.getKey(conversationId, messageId);
    let state = this.cache.get(key);

    if (!state) {
      state = new MessageDeliveryState(
        messageId,
        'PENDING_OUTBOX',
        new Date(),
        undefined,
        'outbox_messages_mssql'
      );
      this.cache.set(key, state);
    }

    return state;
  }

  async retryDelivery(
    conversationId: string,
    messageId: string
  ): Promise<MessageDeliveryState> {
    const key = this.getKey(conversationId, messageId);
    const retriedState = new MessageDeliveryState(
      messageId,
      'PENDING_OUTBOX',
      new Date(),
      undefined,
      'outbox_messages_mssql'
    );
    this.cache.set(key, retriedState);
    return retriedState;
  }
}
