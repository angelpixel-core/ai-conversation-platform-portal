import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
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
      'Enterprise Cloud Migration',
      [
        new Message(
          '1',
          'assistant',
          '¡Hola! Bienvenido a la plataforma de IA conversacional. ¿En qué puedo asistirte hoy?',
          new Date(),
          'confirmed'
        ),
      ]
    );
    vi.spyOn(container.conversationGateway, 'getConversation').mockResolvedValue(mockConv);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('renders conversation header, messages, and input field', async () => {
    render(<ChatConsole conversationId={conversationId} />, { wrapper });

    expect(await screen.findByText('Enterprise Cloud Migration')).toBeInTheDocument();
    expect(
      screen.getByText('¡Hola! Bienvenido a la plataforma de IA conversacional. ¿En qué puedo asistirte hoy?')
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Escribe tu consulta sobre infraestructura/i)).toBeInTheDocument();
  });

  it('sends message when clicking quick prompt chip', async () => {
    const user = userEvent.setup();
    const sendSpy = vi.spyOn(container.conversationGateway, 'sendMessage').mockResolvedValue(
      new Message('2', 'user', '📊 Calcular presupuesto cloud', new Date(), 'confirmed')
    );

    render(<ChatConsole conversationId={conversationId} />, { wrapper });
    await screen.findByText('Enterprise Cloud Migration');

    const chip = screen.getByRole('button', { name: /📊 Calcular presupuesto cloud/i });
    await act(async () => {
      await user.click(chip);
    });

    expect(sendSpy).toHaveBeenCalledWith(
      conversationId,
      '📊 Calcular presupuesto cloud',
      expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    );
  });

  it('opens Nueva Conversación modal, creates conversation and switches active thread', async () => {
    const user = userEvent.setup();
    const newConvId = 'conv-created-99';

    const createSpy = vi.spyOn(container.conversationGateway, 'createConversation').mockResolvedValue({
      id: newConvId,
      title: 'Auditoría Kubernetes',
    });

    const newMockConv = new ConversationAggregate(
      ConversationId.create(newConvId),
      'Auditoría Kubernetes',
      [
        new Message(
          'new-1',
          'assistant',
          'Conversación inicializada.',
          new Date(),
          'confirmed'
        ),
      ]
    );
    vi.spyOn(container.conversationGateway, 'getConversation').mockImplementation(async (id) => {
      if (id === newConvId) return newMockConv;
      return new ConversationAggregate(ConversationId.create(id), 'Enterprise Cloud Migration', []);
    });

    render(<ChatConsole conversationId={conversationId} />, { wrapper });
    await screen.findByText('Enterprise Cloud Migration');

    // Click "Nueva Conversación" button in header
    const newBtn = screen.getByRole('button', { name: /Nueva Conversación/i });
    await act(async () => {
      await user.click(newBtn);
    });

    // Modal appears
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    const titleInput = screen.getByPlaceholderText(/Migración Kubernetes Enterprise/i);
    await act(async () => {
      await user.type(titleInput, 'Auditoría Kubernetes');
    });

    const submitBtn = screen.getByRole('button', { name: /Crear Hilo/i });
    await act(async () => {
      await user.click(submitBtn);
    });

    expect(createSpy).toHaveBeenCalledWith(
      'Auditoría Kubernetes',
      expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    );
  });

  it('renders turn lock banner when user has sent a message awaiting assistant', async () => {
    // Create aggregate where last message is from user (turn locked)
    const turnLockedConv = new ConversationAggregate(
      ConversationId.create(conversationId),
      'Enterprise Cloud Migration',
      [
        new Message('1', 'user', 'Pregunta pendiente', new Date(), 'confirmed'),
      ]
    );
    vi.spyOn(container.conversationGateway, 'getConversation').mockResolvedValue(turnLockedConv);

    render(<ChatConsole conversationId={conversationId} />, { wrapper });

    expect(await screen.findByText(/Turno Protegido/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Esperando a que el asistente responda/i)).toBeDisabled();
  });
});
