import { describe, it, expect, beforeEach } from 'vitest';
import { MockConversationGateway } from './MockConversationGateway';

describe('MockConversationGateway', () => {
  let gateway: MockConversationGateway;

  beforeEach(() => {
    gateway = new MockConversationGateway();
  });

  it('fetches existing default demo conversation with messages', async () => {
    const conv = await gateway.getConversation('conv-cloud-1');
    expect(conv.id.value).toBe('conv-cloud-1');
    expect(conv.title).toBe('Enterprise Cloud Migration');
    expect(conv.messages.length).toBeGreaterThan(0);
    expect(conv.messages[0].role).toBe('assistant');
  });

  it('sends user message and receives simulated assistant response', async () => {
    const userMsg = await gateway.sendMessage(
      'conv-cloud-1',
      'Calcular presupuesto de infraestructura cloud.',
      'c78342c2-8419-42b7-84be-50d4d38562f1'
    );

    expect(userMsg.role).toBe('user');
    expect(userMsg.content).toBe('Calcular presupuesto de infraestructura cloud.');

    const conv = await gateway.getConversation('conv-cloud-1');
    const lastMsg = conv.messages[conv.messages.length - 1];
    expect(lastMsg.role).toBe('assistant');
    expect(lastMsg.content).toContain('presupuesto');
  });

  it('deduplicates message when the same idempotency key is submitted twice', async () => {
    const key = 'd89342c2-8419-42b7-84be-50d4d38562f2';
    const first = await gateway.sendMessage('conv-cloud-1', 'Consultar política de seguridad', key);
    const second = await gateway.sendMessage('conv-cloud-1', 'Consultar política de seguridad', key);

    expect(second.id).toBe(first.id);

    const conv = await gateway.getConversation('conv-cloud-1');
    const userMessages = conv.messages.filter((m) => m.content === 'Consultar política de seguridad');
    expect(userMessages).toHaveLength(1);
  });

  it('creates new conversation with unique id', async () => {
    const created = await gateway.createConversation(
      'Enterprise Cloud Migration',
      'e99342c2-8419-42b7-84be-50d4d38562f3'
    );

    expect(created.id).toBeDefined();
    expect(created.title).toBe('Enterprise Cloud Migration');

    const conv = await gateway.getConversation(created.id);
    expect(conv.title).toBe('Enterprise Cloud Migration');
  });
});
