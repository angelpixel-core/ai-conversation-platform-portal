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
    // Seed a default demo conversation for portal testing matching the backend walkthrough
    const defaultId = 'conv-cloud-1';
    this.conversations.set(
      defaultId,
      new ConversationAggregate(
        ConversationId.create(defaultId),
        'Enterprise Cloud Migration',
        [
          new Message(
            'msg-welcome',
            'assistant',
            '¡Hola! Bienvenido a la plataforma de IA conversacional. ¿En qué puedo asistirte hoy?',
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
      'Nueva Conversación Corporativa',
      [
        new Message(
          'msg-welcome',
          'assistant',
          '¡Hola! Bienvenido a la plataforma de IA conversacional. ¿En qué puedo asistirte hoy?',
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
        `¡Hola! Conversación "${title}" inicializada exitosamente. ¿En qué puedo asistirte hoy?`,
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

    // 3. Simulate conversational bot reply based on enterprise cloud domain
    const lower = content.toLowerCase();
    let reply = `Recibido: "${content}". Procesando con motor de inferencia y Transactional Outbox...`;

    if (lower.includes('presupuesto') || lower.includes('budget') || lower.includes('cloud')) {
      reply =
        'El presupuesto estimado para la infraestructura cloud en el período mensual actual es de $1,000.00 USD con un balance disponible de $735.00 USD (Tier PRO).';
    } else if (lower.includes('seguridad') || lower.includes('política') || lower.includes('security')) {
      reply =
        'La política de seguridad multi-tenant exige validación estricta de X-Tenant-ID, cifrado de datos en reposo y evaluación de guardrails contra prompt injection.';
    } else if (lower.includes('token') || lower.includes('cuota')) {
      reply =
        'La cuota asignada es de 8,192 tokens por petición con un límite de 120 peticiones por minuto.';
    } else if (lower.includes('arquitectura') || lower.includes('multi-tenant')) {
      reply =
        'La arquitectura del sistema opera con Clean Architecture y aislamiento de datos por tenant corporativo, desacoplando eventos mediante Transactional Outbox.';
    }

    conv.appendAssistantMessage(reply);

    return userMsg;
  }
}
