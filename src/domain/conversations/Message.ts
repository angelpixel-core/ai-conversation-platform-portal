export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageStatus = 'optimistic' | 'sending' | 'confirmed' | 'failed';

export class Message {
  constructor(
    public readonly id: string,
    public readonly role: MessageRole,
    public readonly content: string,
    public readonly createdAt: Date = new Date(),
    public readonly status: MessageStatus = 'confirmed',
    public readonly idempotencyKey?: string
  ) {}

  get isUser(): boolean {
    return this.role === 'user';
  }

  get isAssistant(): boolean {
    return this.role === 'assistant';
  }
}
