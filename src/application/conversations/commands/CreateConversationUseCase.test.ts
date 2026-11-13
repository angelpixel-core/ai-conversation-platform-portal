import { describe, it, expect, vi } from 'vitest';
import { CreateConversationUseCase } from './CreateConversationUseCase';
import { ConversationGatewayPort } from '@/domain/conversations/ConversationGatewayPort';

describe('CreateConversationUseCase', () => {
  it('creates conversation with default title if empty', async () => {
    const mockGateway: ConversationGatewayPort = {
      getConversation: vi.fn(),
      createConversation: vi.fn().mockResolvedValue({ id: 'conv-new-1', title: 'Nueva Conversación' }),
      sendMessage: vi.fn(),
    };
    const useCase = new CreateConversationUseCase(mockGateway);

    const result = await useCase.execute({ title: '   ' });
    expect(result.id).toBe('conv-new-1');
    expect(mockGateway.createConversation).toHaveBeenCalledWith(
      'Nueva Conversación',
      expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    );
  });

  it('uses provided title and custom idempotency key', async () => {
    const key = '7b8442c2-8419-42b7-84be-50d4d38562f1';
    const mockGateway: ConversationGatewayPort = {
      getConversation: vi.fn(),
      createConversation: vi.fn().mockResolvedValue({ id: 'conv-new-2', title: 'Migración AWS' }),
      sendMessage: vi.fn(),
    };
    const useCase = new CreateConversationUseCase(mockGateway);

    const result = await useCase.execute({ title: 'Migración AWS', idempotencyKey: key });
    expect(result.id).toBe('conv-new-2');
    expect(mockGateway.createConversation).toHaveBeenCalledWith('Migración AWS', key);
  });
});

