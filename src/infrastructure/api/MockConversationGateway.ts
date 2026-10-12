import {
  ConversationGatewayPort,
  CreateConversationOutput,
} from '@/domain/conversations/ConversationGatewayPort';
import { ConversationAggregate } from '@/domain/conversations/ConversationAggregate';
import { ConversationId } from '@/domain/conversations/ConversationId';
import { IdempotencyKey } from '@/domain/conversations/IdempotencyKey';
import { Message } from '@/domain/conversations/Message';

export class MockConversationGateway implements ConversationGatewayPort {
  private conversations = new Map<string, ConversationAggregate>();
  private idempotencyCache = new Map<string, Message>();

  constructor() {
    // Default demo conversation
    const initialId = ConversationId.create('conv-cloud-1');
    const initialConv = new ConversationAggregate(initialId, 'Consultas Café & Carta', [
      new Message(
        'msg-welcome',
        'assistant',
        '¡Hola! Bienvenido al portal de café. ¿En qué puedo ayudarte hoy?',
        new Date()
      ),
    ]);
    this.conversations.set('conv-cloud-1', initialConv);
  }

  async getConversation(id: string): Promise<ConversationAggregate> {
    const existing = this.conversations.get(id);
    if (existing) {
      return existing;
    }

    // Lazy create if not found
    const newConv = new ConversationAggregate(
      ConversationId.create(id),
      `Conversación ${id}`,
      [
        new Message(
          'msg-welcome',
          'assistant',
          '¡Hola! Conversación iniciada. ¿Qué necesitas consultar?',
          new Date()
        ),
      ]
    );
    this.conversations.set(id, newConv);
    return newConv;
  }

  async createConversation(
    title: string,
    idempotencyKey: string
  ): Promise<CreateConversationOutput> {
    const id = 'conv-' + crypto.randomUUID().slice(0, 8);
    const conv = new ConversationAggregate(ConversationId.create(id), title, [
      new Message(
        'msg-welcome',
        'assistant',
        '¡Hola! Nueva conversación creada. ¿En qué puedo ayudarte?',
        new Date()
      ),
    ]);
    this.conversations.set(id, conv);
    return { id, title };
  }

  async sendMessage(
    conversationId: string,
    content: string,
    idempotencyKey: string
  ): Promise<Message> {
    // 1. Check idempotency cache for deduplication
    if (this.idempotencyCache.has(idempotencyKey)) {
      return this.idempotencyCache.get(idempotencyKey)!;
    }

    const conv = await this.getConversation(conversationId);
    const key = IdempotencyKey.from(idempotencyKey);
    const userMsg = conv.appendUserMessage(content, key);
    this.idempotencyCache.set(idempotencyKey, userMsg);

    // 2. Simulate conversational bot reply
    let reply = `Recibido: "${content}". Procesando con motor RAG de cafetería...`;
    if (content.toLowerCase().includes('almendra')) {
      reply = '¡Sí! Disponemos de leche de almendras y avena orgánica por un adicional de $0.50.';
    } else if (content.toLowerCase().includes('cappuccino') || content.toLowerCase().includes('espresso')) {
      reply = 'Excelente elección. Nuestro café de especialidad es de origen colombiano con notas a chocolate y avellana.';
    }

    conv.appendAssistantMessage(reply);

    return userMsg;
  }
}
