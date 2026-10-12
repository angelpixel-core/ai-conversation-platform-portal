import React, { useState, FormEvent, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';

export interface ChatInputProps {
  onSendMessage: (content: string) => void;
  isSubmitting?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isSubmitting = false,
  disabled = false,
  placeholder = 'Escribe tu consulta sobre café, menú o pedidos...',
}) => {
  const [content, setContent] = useState('');

  const isDisabled = disabled || isSubmitting;
  const isSubmitDisabled = isDisabled || content.trim().length === 0;

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || isDisabled) return;

    onSendMessage(trimmed);
    setContent('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3 items-center">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isDisabled}
        className="flex-1 px-4 py-3 bg-white border-2 border-black font-medium text-sm text-black placeholder:text-zinc-500 shadow-neo-sm focus:outline-none focus:shadow-neo transition-all disabled:bg-zinc-100 disabled:opacity-75"
      />

      <button
        type="submit"
        disabled={isSubmitDisabled}
        aria-label="Enviar mensaje"
        className="inline-flex items-center gap-2 px-5 py-3 bg-sky-400 text-black font-black uppercase text-xs tracking-wider border-2 border-black shadow-neo hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-neo-sm active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
            <span className="hidden sm:inline">Enviando</span>
          </>
        ) : (
          <>
            <Send className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Enviar</span>
          </>
        )}
      </button>
    </form>
  );
};
