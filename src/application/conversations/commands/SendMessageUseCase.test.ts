import { describe, it, expect, vi } from 'vitest';
import { SendMessageUseCase } from './SendMessageUseCase';
import { ConversationGatewayPort } from '@/domain/conversations/ConversationGatewayPort';
import { Message } from '@/domain/conversations/Message';

describe('SendMessageUseCase', () => {
  it('throws error when message content is empty or whitespace', async () => {
    const mockGateway: ConversationGatewayPort = {
      getConversation: vi.fn(),
      createConversation: vi.fn(),
      sendMessage: vi.fn(),
    };
    const useCase = new SendMessageUseCase(mockGateway);

    await expect(useCase.execute({ conversationId: 'c-1', content: '   ' })).rejects.toThrow(
      'El contenido del mensaje no puede estar vacío.'
    );
    expect(mockGateway.sendMessage).not.toHaveBeenCalled();
  });

  it('generates an idempotency key when not provided and trims content', async () => {
    const mockGateway: ConversationGatewayPort = {
      getConversation: vi.fn(),
      createConversation: vi.fn(),
      sendMessage: vi.fn().mockImplementation((convId, content, key) => {
        return Promise.resolve(new Message('msg-1', 'user', content, new Date(), 'confirmed', key));
      }),
    };
    const useCase = new SendMessageUseCase(mockGateway);

    const msg = await useCase.execute({
      conversationId: 'c-1',
      content: '  Calcular presupuesto cloud  ',
    });

    expect(msg.content).toBe('Calcular presupuesto cloud');
    expect(mockGateway.sendMessage).toHaveBeenCalledWith(
      'c-1',
      'Calcular presupuesto cloud',
      expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    );
  });

  it('reuses existing idempotency key when provided for retry', async () => {
    const customKey = 'f059fa8f-6ef0-437f-9e9e-4d41a9ded399';
    const mockGateway: ConversationGatewayPort = {
      getConversation: vi.fn(),
      createConversation: vi.fn(),
      sendMessage: vi.fn().mockResolvedValue(
        new Message('msg-1', 'user', 'Reintento', new Date(), 'confirmed', customKey)
      ),
    };
    const useCase = new SendMessageUseCase(mockGateway);

    await useCase.execute({
      conversationId: 'c-1',
      content: 'Reintento',
      idempotencyKey: customKey,
    });

    expect(mockGateway.sendMessage).toHaveBeenCalledWith('c-1', 'Reintento', customKey);
  });
});

