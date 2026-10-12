import { useState, useCallback, useEffect } from 'react';
import { DeliveryStatus, MessageDeliveryState } from '@/domain/messaging/DeliveryStatus';
import { OutboxGateway } from '@/domain/messaging/OutboxGateway';
import { MockOutboxGateway } from '@/infrastructure/api/MockOutboxGateway';
import { HttpOutboxAdapter } from '@/infrastructure/api/HttpOutboxAdapter';

const defaultGateway: OutboxGateway =
  process.env.NEXT_PUBLIC_USE_MOCKS === 'true'
    ? new MockOutboxGateway()
    : new HttpOutboxAdapter();

export interface UseMessageDeliveryStatusOptions {
  conversationId: string;
  messageId: string;
  initialStatus?: DeliveryStatus;
  gateway?: OutboxGateway;
  autoPoll?: boolean;
  pollIntervalMs?: number;
}

export function useMessageDeliveryStatus({
  conversationId,
  messageId,
  initialStatus = 'PENDING_OUTBOX',
  gateway = defaultGateway,
  autoPoll = false,
  pollIntervalMs = 3000,
}: UseMessageDeliveryStatusOptions) {
  const [deliveryState, setDeliveryState] = useState<MessageDeliveryState>(
    () => new MessageDeliveryState(messageId, initialStatus, new Date())
  );
  const [isRetrying, setIsRetrying] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const updated = await gateway.getMessageDeliveryStatus(conversationId, messageId);
      setDeliveryState(updated);
      return updated;
    } catch {
      // Retain existing state gracefully
      return deliveryState;
    }
  }, [conversationId, messageId, gateway, deliveryState]);

  const retry = useCallback(async () => {
    if (!gateway.retryDelivery) return;
    setIsRetrying(true);
    try {
      const retried = await gateway.retryDelivery(conversationId, messageId);
      setDeliveryState(retried);
    } finally {
      setIsRetrying(false);
    }
  }, [conversationId, messageId, gateway]);

  const advanceSimulation = useCallback(
    (newStatus: DeliveryStatus, workerId?: string) => {
      setDeliveryState((prev) =>
        prev.transitionTo(newStatus, {
          workerId: workerId ?? 'worker-node-alpha',
          queue: 'conversation.llm_processing.queue',
        })
      );
    },
    []
  );

  useEffect(() => {
    if (!autoPoll || deliveryState.isTerminal) return;

    const interval = setInterval(() => {
      refresh();
    }, pollIntervalMs);

    return () => clearInterval(interval);
  }, [autoPoll, deliveryState.isTerminal, refresh, pollIntervalMs]);

  return {
    deliveryState,
    isRetrying,
    refresh,
    retry,
    advanceSimulation,
  };
}
