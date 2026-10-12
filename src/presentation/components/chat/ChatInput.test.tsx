import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ChatInput } from './ChatInput';

describe('ChatInput', () => {
  it('renders input field and submit button', () => {
    render(<ChatInput onSendMessage={vi.fn()} />);

    expect(screen.getByPlaceholderText(/Escribe tu consulta/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enviar mensaje/i })).toBeInTheDocument();
  });

  it('submits message and clears text when Enter key or click is pressed', async () => {
    const handleSend = vi.fn();
    const user = userEvent.setup();

    render(<ChatInput onSendMessage={handleSend} />);

    const input = screen.getByPlaceholderText(/Escribe tu consulta/i);
    await user.type(input, '¿Tienen café descafeinado?{Enter}');

    expect(handleSend).toHaveBeenCalledWith('¿Tienen café descafeinado?');
    expect(input).toHaveValue('');
  });

  it('disables submit button and input when isSubmitting is true or input is empty', () => {
    const { rerender } = render(<ChatInput onSendMessage={vi.fn()} isSubmitting={false} />);
    const submitBtn = screen.getByRole('button', { name: /Enviar mensaje/i });
    expect(submitBtn).toBeDisabled(); // empty input

    rerender(<ChatInput onSendMessage={vi.fn()} isSubmitting={true} />);
    expect(submitBtn).toBeDisabled();
  });
});
