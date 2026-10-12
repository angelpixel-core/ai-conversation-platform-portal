import { MessageDeliveryState } from './DeliveryStatus';

export interface OutboxGateway {
  /**
   * Retrieves the outbox / broker / worker delivery state for a given message.
   */
  getMessageDeliveryStatus(
    conversationId: string,
    messageId: string
  ): Promise<MessageDeliveryState>;

  /**
   * Triggers a manual retry on DLQ dead-lettered messages.
   */
  retryDelivery?(
    conversationId: string,
    messageId: string
  ): Promise<MessageDeliveryState>;
}
