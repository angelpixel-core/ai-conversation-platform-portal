import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpConversationAdapter } from './HttpConversationAdapter';
import { tenantSessionStore } from '../storage/tenantSessionStore';
import { TenantId } from '@/domain/tenants/TenantId';

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
});
