import React from 'react';

export interface TypingBlinkCursorProps {
  className?: string;
}

export const TypingBlinkCursor: React.FC<TypingBlinkCursorProps> = ({
  className = '',
}) => {
  return (
    <span
      data-testid="typing-blink-cursor"
      aria-hidden="true"
      className={`inline-block font-mono font-black animate-pulse select-none text-black ml-0.5 ${className}`}
    >
      ▋
    </span>
  );
};
