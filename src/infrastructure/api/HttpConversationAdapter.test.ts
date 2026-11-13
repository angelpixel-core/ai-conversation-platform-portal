import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpConversationAdapter } from './HttpConversationAdapter';
import { tenantSessionStore } from '../storage/tenantSessionStore';
import { TenantId } from '@/domain/tenants/TenantId';
import {
  IdempotencyConflictError,
  TurnInvariantError,
} from '@/domain/conversations/ConversationErrors';

describe('HttpConversationAdapter', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    tenantSessionStore.setActiveTenantId(TenantId.create('corp-acme'));
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('sends message attaching Idempotency-Key header and returns Message entity', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'msg-999',
        conversation_id: 'conv-101',
        role: 'user',
        content: 'Hola',
        created_at: '2026-10-06T15:00:00Z',
      }),
    } as Response);
    global.fetch = mockFetch;

    const adapter = new HttpConversationAdapter('http://localhost:8000');
    const msg = await adapter.sendMessage('conv-101', 'Hola', '7b8442c2-8419-42b7-84be-50d4d38562f1');

    expect(msg.role).toBe('user');
    expect(msg.content).toBe('Hola');

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('http://localhost:8000/conversations/conv-101/messages');
    const headers = options.headers as Headers;
    expect(headers.get('Idempotency-Key')).toBe('7b8442c2-8419-42b7-84be-50d4d38562f1');
    expect(headers.get('X-Tenant-Id')).toBe('corp-acme');
  });

  it('tolerates backend message payload missing id by auto-generating one', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        conversation_id: 'conv-101',
        role: 'user',
        content: 'Calcular presupuesto',
        created_at: '2026-10-06T15:00:00Z',
      }),
    } as Response);
    global.fetch = mockFetch;

    const adapter = new HttpConversationAdapter('http://localhost:8000');
    const msg = await adapter.sendMessage('conv-101', 'Calcular presupuesto', '7b8442c2-8419-42b7-84be-50d4d38562f1');

    expect(msg.id).toBeTruthy();
    expect(msg.content).toBe('Calcular presupuesto');
    expect(msg.idempotencyKey).toBe('7b8442c2-8419-42b7-84be-50d4d38562f1');
  });

  it('creates conversation attaching Idempotency-Key and payload', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: 'conv-created-1',
        title: 'Nueva Conversación',
      }),
    } as Response);
    global.fetch = mockFetch;

    const adapter = new HttpConversationAdapter('http://localhost:8000');
    const result = await adapter.createConversation('Nueva Conversación', '8c9442c2-8419-42b7-84be-50d4d38562f2');

    expect(result.id).toBe('conv-created-1');
    expect(result.title).toBe('Nueva Conversación');

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('http://localhost:8000/conversations');
    const headers = options.headers as Headers;
    expect(headers.get('Idempotency-Key')).toBe('8c9442c2-8419-42b7-84be-50d4d38562f2');
  });

  it('translates HTTP 409 into IdempotencyConflictError', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      statusText: 'Conflict',
      json: async () => ({
        detail: 'El Idempotency-Key ya fue utilizado con un payload diferente.',
      }),
    } as Response);
    global.fetch = mockFetch;

    const adapter = new HttpConversationAdapter('http://localhost:8000');
    await expect(
      adapter.sendMessage('conv-101', 'Contenido diferente', '7b8442c2-8419-42b7-84be-50d4d38562f1')
    ).rejects.toThrow(IdempotencyConflictError);
  });

  it('translates HTTP 400 turn violation into TurnInvariantError', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({
        detail: 'Cannot append user message before assistant responds.',
      }),
    } as Response);
    global.fetch = mockFetch;

    const adapter = new HttpConversationAdapter('http://localhost:8000');
    await expect(
      adapter.sendMessage('conv-101', 'Mensaje repetido', '7b8442c2-8419-42b7-84be-50d4d38562f1')
    ).rejects.toThrow(TurnInvariantError);
  });

  it('fetches conversation aggregate via getConversation', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'conv-555',
        title: 'Migración Cloud',
        messages: [
          { id: 'm-1', role: 'user', content: 'Inicio', created_at: '2026-10-06T12:00:00Z' },
          { id: 'm-2', role: 'assistant', content: 'Respuesta', created_at: '2026-10-06T12:01:00Z' },
        ],
      }),
    } as Response);
    global.fetch = mockFetch;

    const adapter = new HttpConversationAdapter('http://localhost:8000');
    const conv = await adapter.getConversation('conv-555');

    expect(conv.id.value).toBe('conv-555');
    expect(conv.title).toBe('Migración Cloud');
    expect(conv.messages).toHaveLength(2);
    expect(conv.canAppendUserMessage).toBe(true);
  });
});
