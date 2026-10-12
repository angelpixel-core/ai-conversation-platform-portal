import {
  ConversationGatewayPort,
  CreateConversationOutput,
} from '@/domain/conversations/ConversationGatewayPort';
import { ConversationAggregate } from '@/domain/conversations/ConversationAggregate';
import { ConversationId } from '@/domain/conversations/ConversationId';
import { Message } from '@/domain/conversations/Message';
import { IdempotencyKey } from '@/domain/conversations/IdempotencyKey';

export class MockConversationGateway implements ConversationGatewayPort {
  private conversations = new Map<string, ConversationAggregate>();
  private idempotencyCache = new Map<string, Message>();

  constructor(private readonly simulatedDelayMs: number = typeof window !== 'undefined' ? 900 : 0) {
    // Seed a default demo conversation for portal testing
    const defaultId = 'conv-cloud-1';
    this.conversations.set(
      defaultId,
      new ConversationAggregate(
        ConversationId.create(defaultId),
        'Consultas Café & Carta',
        [
          new Message(
            'msg-welcome',
            'assistant',
            '¡Hola! Bienvenido al portal de café. ¿En qué puedo ayudarte hoy?',
            new Date(Date.now() - 60000),
            'confirmed'
          ),
        ]
      )
    );
  }

  async getConversation(id: string): Promise<ConversationAggregate> {
    const existing = this.conversations.get(id);
    if (existing) {
      return existing;
    }

    const newConv = new ConversationAggregate(
      ConversationId.create(id),
      'Nueva Conversación',
      [
        new Message(
          'msg-welcome',
          'assistant',
          '¡Hola! Bienvenido al portal de café. ¿En qué puedo ayudarte hoy?',
          new Date(),
          'confirmed'
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
        new Date(),
        'confirmed'
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

    // 2. Simulate realistic async latency in browser environments
    if (this.simulatedDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.simulatedDelayMs));
    }

    const conv = await this.getConversation(conversationId);
    const key = IdempotencyKey.from(idempotencyKey);
    const userMsg = conv.appendUserMessage(content, key);
    this.idempotencyCache.set(idempotencyKey, userMsg);

    // 3. Simulate conversational bot reply
    let reply = `Recibido: "${content}". Procesando con motor RAG de cafetería...`;
    if (content.toLowerCase().includes('almendra') || content.toLowerCase().includes('avena')) {
      reply = '¡Excelente elección! Disponemos de leche de avena orgánica y almendras por un adicional de $0.50.';
    } else if (content.toLowerCase().includes('cappuccino') || content.toLowerCase().includes('espresso')) {
      reply = 'Excelente elección. Nuestro café de especialidad es de origen colombiano con notas a chocolate y avellana.';
    } else if (content.toLowerCase().includes('pastelería') || content.toLowerCase().includes('medialuna')) {
      reply = 'Nuestra pastelería recién horneada incluye medialunas de manteca, croissants artesanales y cookies con chips de chocolate.';
    }

    conv.appendAssistantMessage(reply);

    return userMsg;
  }
}
