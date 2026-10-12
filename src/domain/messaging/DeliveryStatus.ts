export type DeliveryStatus =
  | 'PENDING_OUTBOX'
  | 'QUEUED_BROKER'
  | 'PROCESSING_WORKER'
  | 'COMPLETED'
  | 'FAILED_DLQ';

export interface DeliveryTransitionOptions {
  workerId?: string;
  queue?: string;
  broker?: string;
  errorMessage?: string;
}

export class MessageDeliveryState {
  constructor(
    public readonly messageId: string,
    public readonly status: DeliveryStatus,
    public readonly updatedAt: Date,
    public readonly workerId?: string,
    public readonly queue?: string,
    public readonly errorMessage?: string,
    public readonly broker: string = 'rabbitmq'
  ) {}

  get isTerminal(): boolean {
    return this.status === 'COMPLETED' || this.status === 'FAILED_DLQ';
  }

  get requiresAttention(): boolean {
    return this.status === 'FAILED_DLQ';
  }

  transitionTo(
    newStatus: DeliveryStatus,
    options?: DeliveryTransitionOptions
  ): MessageDeliveryState {
    return new MessageDeliveryState(
      this.messageId,
      newStatus,
      new Date(),
      options?.workerId ?? this.workerId,
      options?.queue ?? this.queue,
      options?.errorMessage ?? this.errorMessage,
      options?.broker ?? this.broker
    );
  }
}
