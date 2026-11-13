import { describe, it, expect } from 'vitest';
import { ConversationAggregate } from './ConversationAggregate';
import { ConversationId } from './ConversationId';
import { IdempotencyKey } from './IdempotencyKey';
import { Message } from './Message';

describe('ConversationAggregate', () => {
  it('instantiates conversation aggregate with id, title, and initial messages', () => {
    const convId = ConversationId.create('conv-101');
    const conv = new ConversationAggregate(convId, 'Atención Cliente', []);

    expect(conv.id.value).toBe('conv-101');
    expect(conv.title).toBe('Atención Cliente');
    expect(conv.messages).toHaveLength(0);
    expect(conv.canAppendUserMessage).toBe(true);
  });

  it('allows appending user message when history is empty or last message was from assistant', () => {
    const conv = new ConversationAggregate(ConversationId.create('conv-101'), 'Test', []);
    const key = IdempotencyKey.generate();

    const userMsg = conv.appendUserMessage('Calcular presupuesto de infraestructura cloud.', key);
    expect(userMsg.role).toBe('user');
    expect(userMsg.content).toBe('Calcular presupuesto de infraestructura cloud.');
    expect(userMsg.idempotencyKey).toBe(key.value);
    expect(conv.messages).toHaveLength(1);

    // Turn rule: Now assistant must respond before user can send another message
    expect(conv.canAppendUserMessage).toBe(false);
    expect(() => conv.appendUserMessage('Otro mensaje', IdempotencyKey.generate())).toThrow(
      /Cannot append user message before assistant responds/i
    );
  });

  it('allows user to send message after assistant replies', () => {
    const conv = new ConversationAggregate(ConversationId.create('conv-101'), 'Test', []);
    conv.appendUserMessage('Hola', IdempotencyKey.generate());
    conv.appendAssistantMessage('¡Hola! Bienvenido a la plataforma. ¿En qué puedo asistirte hoy?');

    expect(conv.canAppendUserMessage).toBe(true);
    expect(conv.messages).toHaveLength(2);
    expect(conv.messages[1].role).toBe('assistant');
  });

  it('deduplicates user message if the same IdempotencyKey is submitted again', () => {
    const conv = new ConversationAggregate(ConversationId.create('conv-101'), 'Test', []);
    const key = IdempotencyKey.generate();

    const firstMsg = conv.appendUserMessage('Consultar política de seguridad', key);
    const replayMsg = conv.appendUserMessage('Consultar política de seguridad', key);

    expect(conv.messages).toHaveLength(1);
    expect(replayMsg.id).toBe(firstMsg.id);
  });
});
