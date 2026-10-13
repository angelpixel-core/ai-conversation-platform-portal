export interface StreamTokenEvent {
  sequenceId: number;
  text: string;
}

export interface StreamCallbacks {
  onToken: (event: StreamTokenEvent) => void;
  onDone: () => void;
  onError: (error: Error) => void;
  onReconnect?: (attempt: number) => void;
}

export interface StreamingGateway {
  openStream(
    conversationId: string,
    tenantId: string,
    lastEventId: number | null,
    callbacks: StreamCallbacks,
    signal?: AbortSignal
  ): Promise<void>;
}
