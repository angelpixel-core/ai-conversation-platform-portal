import { ConversationId } from './ConversationId';
import { IdempotencyKey } from './IdempotencyKey';
import { Message } from './Message';

export class ConversationAggregate {
  private _messages: Message[] = [];

  constructor(
    public readonly id: ConversationId,
    public readonly title: string,
    initialMessages: Message[] = []
  ) {
    this._messages = [...initialMessages];
  }

  get messages(): Message[] {
    return [...this._messages];
  }

  /**
   * Domain Rule: Assistant must respond before user can append another message,
   * unless the conversation is currently empty.
   */
  get canAppendUserMessage(): boolean {
    if (this._messages.length === 0) return true;
    const lastMessage = this._messages[this._messages.length - 1];
    return lastMessage.role === 'assistant';
  }

  appendUserMessage(content: string, idempotencyKey: IdempotencyKey): Message {
    // 1. Check for replay/idempotency match
    const existing = this._messages.find(
      (m) => m.idempotencyKey === idempotencyKey.value
    );
    if (existing) {
      return existing;
    }

    // 2. Validate turn alternation invariant
    if (!this.canAppendUserMessage) {
      throw new Error('Cannot append user message before assistant responds.');
    }

    const message = new Message(
      'msg-' + crypto.randomUUID().slice(0, 8),
      'user',
      content,
      new Date(),
      'confirmed',
      idempotencyKey.value
    );

    this._messages.push(message);
    return message;
  }

  appendAssistantMessage(content: string): Message {
    const message = new Message(
      'msg-' + crypto.randomUUID().slice(0, 8),
      'assistant',
      content,
      new Date(),
      'confirmed'
    );
    this._messages.push(message);
    return message;
  }
}
