import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
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
    await act(async () => {
      await user.type(input, 'Calcular presupuesto de infraestructura cloud.{Enter}');
    });

    expect(handleSend).toHaveBeenCalledWith('Calcular presupuesto de infraestructura cloud.');
    expect(input).toHaveValue('');
  });

  it('disables submit button and input when isSubmitting is true or input is empty', () => {
    const { rerender } = render(<ChatInput onSendMessage={vi.fn()} isSubmitting={false} />);
    const submitBtn = screen.getByRole('button', { name: /Enviar mensaje/i });
    expect(submitBtn).toBeDisabled(); // empty input

    rerender(<ChatInput onSendMessage={vi.fn()} isSubmitting={true} />);
    expect(submitBtn).toBeDisabled();
  });

  it('renders retry banner when failedPayload is provided and re-submits with same key', async () => {
    const handleSend = vi.fn();
    const handleClear = vi.fn();
    const user = userEvent.setup();

    const failedPayload = {
      content: 'Mensaje fallido previo',
      idempotencyKey: 'f059fa8f-6ef0-437f-9e9e-4d41a9ded399',
    };

    render(
      <ChatInput
        onSendMessage={handleSend}
        failedPayload={failedPayload}
        onClearFailedPayload={handleClear}
      />
    );

    expect(screen.getByText(/Error de red al enviar/i)).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /Reintentar con la misma Idempotency-Key/i });
    await act(async () => {
      await user.click(retryBtn);
    });

    expect(handleSend).toHaveBeenCalledWith(
      'Mensaje fallido previo',
      'f059fa8f-6ef0-437f-9e9e-4d41a9ded399'
    );
    expect(handleClear).toHaveBeenCalled();
  });
});

