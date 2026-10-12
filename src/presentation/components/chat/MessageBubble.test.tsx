import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MessageBubble } from './MessageBubble';
import { Message } from '@/domain/conversations/Message';

describe('MessageBubble', () => {
  it('renders user message with sky styling and user badge', () => {
    const msg = new Message('1', 'user', 'Hola, quiero ordenar un latte', new Date(), 'confirmed');
    render(<MessageBubble message={msg} />);

    expect(screen.getByText('Hola, quiero ordenar un latte')).toBeInTheDocument();
    expect(screen.getByText('TÚ')).toBeInTheDocument();
  });

  it('renders assistant message with bot icon and amber styling', () => {
    const msg = new Message('2', 'assistant', '¡Claro! ¿Qué tamaño prefieres?', new Date(), 'confirmed');
    render(<MessageBubble message={msg} />);

    expect(screen.getByText('¡Claro! ¿Qué tamaño prefieres?')).toBeInTheDocument();
    expect(screen.getByText('ASISTENTE IA')).toBeInTheDocument();
  });

  it('renders optimistic pending indicator when status is optimistic', () => {
    const msg = new Message('3', 'user', 'Mensaje en vuelo', new Date(), 'optimistic');
    render(<MessageBubble message={msg} />);

    expect(screen.getByText(/Enviando/i)).toBeInTheDocument();
  });
});
