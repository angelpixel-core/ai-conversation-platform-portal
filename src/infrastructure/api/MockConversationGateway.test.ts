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
    expect(conv.messages.length).toBeGreaterThan(0);
    expect(conv.messages[0].role).toBe('assistant');
  });

  it('sends user message and receives simulated assistant response', async () => {
    const userMsg = await gateway.sendMessage(
      'conv-cloud-1',
      '¿Tienen leche de almendras?',
      'c78342c2-8419-42b7-84be-50d4d38562f1'
    );

    expect(userMsg.role).toBe('user');
    expect(userMsg.content).toBe('¿Tienen leche de almendras?');

    const conv = await gateway.getConversation('conv-cloud-1');
    const lastMsg = conv.messages[conv.messages.length - 1];
    expect(lastMsg.role).toBe('assistant');
    expect(lastMsg.content).toContain('almendras');
  });

  it('deduplicates message when the same idempotency key is submitted twice', async () => {
    const key = 'd89342c2-8419-42b7-84be-50d4d38562f2';
    const first = await gateway.sendMessage('conv-cloud-1', 'Quiero un Espresso', key);
    const second = await gateway.sendMessage('conv-cloud-1', 'Quiero un Espresso', key);

    expect(second.id).toBe(first.id);

    const conv = await gateway.getConversation('conv-cloud-1');
    const userMessages = conv.messages.filter((m) => m.content === 'Quiero un Espresso');
    expect(userMessages).toHaveLength(1);
  });

  it('creates new conversation with unique id', async () => {
    const created = await gateway.createConversation(
      'Consulta Pedidos Empresa',
      'e99342c2-8419-42b7-84be-50d4d38562f3'
    );

    expect(created.id).toBeDefined();
    expect(created.title).toBe('Consulta Pedidos Empresa');

    const conv = await gateway.getConversation(created.id);
    expect(conv.title).toBe('Consulta Pedidos Empresa');
  });
});
