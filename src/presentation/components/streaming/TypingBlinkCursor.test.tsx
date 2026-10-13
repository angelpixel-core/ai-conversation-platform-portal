import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { TypingBlinkCursor } from './TypingBlinkCursor';

describe('TypingBlinkCursor Component', () => {
  it('renders blinking cursor block with aria-hidden', () => {
    render(<TypingBlinkCursor />);
    const cursor = screen.getByTestId('typing-blink-cursor');

    expect(cursor).toBeInTheDocument();
    expect(cursor).toHaveAttribute('aria-hidden', 'true');
    expect(cursor).toHaveTextContent('▋');
  });

  it('applies custom className when provided', () => {
    render(<TypingBlinkCursor className="text-amber-500" />);
    const cursor = screen.getByTestId('typing-blink-cursor');

    expect(cursor).toHaveClass('text-amber-500');
  });
});
