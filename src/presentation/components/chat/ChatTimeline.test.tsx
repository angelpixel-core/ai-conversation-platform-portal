import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ChatTimeline } from './ChatTimeline';
import { Message } from '@/domain/conversations/Message';

describe('ChatTimeline', () => {
  it('renders empty state when no messages are present', () => {
    render(<ChatTimeline messages={[]} />);
    expect(screen.getByText(/Sin mensajes en este hilo/i)).toBeInTheDocument();
  });

  it('renders loading state when isLoading is true and no messages', () => {
    render(<ChatTimeline messages={[]} isLoading={true} />);
    expect(screen.getByText(/Cargando historial de conversación/i)).toBeInTheDocument();
  });

  it('renders message bubbles when messages exist', () => {
    const messages = [
      new Message('1', 'user', 'Hola mundo', new Date(), 'confirmed'),
      new Message('2', 'assistant', '¡Hola! ¿En qué puedo ayudarte?', new Date(), 'confirmed'),
    ];
    render(<ChatTimeline messages={messages} />);

    expect(screen.getByText('Hola mundo')).toBeInTheDocument();
    expect(screen.getByText('¡Hola! ¿En qué puedo ayudarte?')).toBeInTheDocument();
  });
});
