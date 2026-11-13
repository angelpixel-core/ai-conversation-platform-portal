import { describe, it, expect, vi } from 'vitest';
import { GetConversationUseCase } from './GetConversationUseCase';
import { ConversationGatewayPort } from '@/domain/conversations/ConversationGatewayPort';
import { ConversationAggregate } from '@/domain/conversations/ConversationAggregate';
import { ConversationId } from '@/domain/conversations/ConversationId';

describe('GetConversationUseCase', () => {
  it('throws error when conversationId is empty', async () => {
    const mockGateway: ConversationGatewayPort = {
      getConversation: vi.fn(),
      createConversation: vi.fn(),
      sendMessage: vi.fn(),
    };
    const useCase = new GetConversationUseCase(mockGateway);

    await expect(useCase.execute('')).rejects.toThrow('El ID de conversación es requerido.');
  });

  it('delegates to gateway when valid conversationId is provided', async () => {
    const aggregate = new ConversationAggregate(ConversationId.create('c-1'), 'Test Title', []);
    const mockGateway: ConversationGatewayPort = {
      getConversation: vi.fn().mockResolvedValue(aggregate),
      createConversation: vi.fn(),
      sendMessage: vi.fn(),
    };
    const useCase = new GetConversationUseCase(mockGateway);

    const result = await useCase.execute('c-1');
    expect(result).toBe(aggregate);
    expect(mockGateway.getConversation).toHaveBeenCalledWith('c-1');
  });
});

