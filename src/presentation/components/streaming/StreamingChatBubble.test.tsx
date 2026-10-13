import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { StreamingChatBubble } from './StreamingChatBubble';

describe('StreamingChatBubble Component', () => {
  it('renders streaming message with blinking cursor while isStreaming is true', () => {
    render(
      <StreamingChatBubble
        text="Para un espresso perfecto..."
        isStreaming={true}
        tokensCount={4}
      />
    );

    expect(screen.getByText(/para un espresso perfecto/i)).toBeInTheDocument();
    expect(screen.getByTestId('typing-blink-cursor')).toBeInTheDocument();
    expect(screen.getByText('4 tokens')).toBeInTheDocument();
  });

  it('hides cursor and shows completed badge when stream finishes', () => {
    render(
      <StreamingChatBubble
        text="Respuesta completa finalizada."
        isStreaming={false}
        tokensCount={10}
      />
    );

    expect(screen.queryByTestId('typing-blink-cursor')).not.toBeInTheDocument();
    expect(screen.getByText(/completado/i)).toBeInTheDocument();
  });
});
