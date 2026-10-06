import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { ChatConsole } from './ChatConsole';
import { container } from '@/infrastructure/container';
import { ConversationAggregate } from '@/domain/conversations/ConversationAggregate';
import { ConversationId } from '@/domain/conversations/ConversationId';
import { Message } from '@/domain/conversations/Message';

describe('ChatConsole', () => {
  let queryClient: QueryClient;
  const conversationId = 'conv-cloud-1';

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.restoreAllMocks();

    const mockConv = new ConversationAggregate(
      ConversationId.create(conversationId),
      'Consultas Café & Carta',
      [
        new Message('1', 'assistant', '¡Hola! ¿Qué café te preparo hoy?', new Date(), 'confirmed'),
      ]
    );
    vi.spyOn(container.conversationGateway, 'getConversation').mockResolvedValue(mockConv);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('renders conversation header, messages, and input field', async () => {
    render(<ChatConsole conversationId={conversationId} />, { wrapper });

    expect(await screen.findByText('Consultas Café & Carta')).toBeInTheDocument();
    expect(screen.getByText('¡Hola! ¿Qué café te preparo hoy?')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Escribe tu consulta/i)).toBeInTheDocument();
  });

  it('sends message when clicking quick prompt chip', async () => {
    const user = userEvent.setup();
    const sendSpy = vi.spyOn(container.conversationGateway, 'sendMessage').mockResolvedValue(
      new Message('2', 'user', '☕ Ver Café del Día', new Date(), 'confirmed')
    );

    render(<ChatConsole conversationId={conversationId} />, { wrapper });
    await screen.findByText('Consultas Café & Carta');

    const chip = screen.getByRole('button', { name: /☕ Ver Café del Día/i });
    await user.click(chip);

    expect(sendSpy).toHaveBeenCalledWith(
      conversationId,
      '☕ Ver Café del Día',
      expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    );
  });
});
