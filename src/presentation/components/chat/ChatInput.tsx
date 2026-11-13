import React, { useState, FormEvent, KeyboardEvent } from 'react';
import { Send, Loader2, RotateCcw, AlertCircle } from 'lucide-react';

export interface FailedPayload {
  content: string;
  idempotencyKey: string;
  error?: string;
}

export interface ChatInputProps {
  onSendMessage: (content: string, idempotencyKey?: string) => void;
  isSubmitting?: boolean;
  disabled?: boolean;
  placeholder?: string;
  failedPayload?: FailedPayload | null;
  onClearFailedPayload?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isSubmitting = false,
  disabled = false,
  placeholder = 'Escribe tu consulta sobre infraestructura, tokens o políticas...',
  failedPayload = null,
  onClearFailedPayload,
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

  const handleRetryFailed = () => {
    if (!failedPayload || isDisabled) return;
    onSendMessage(failedPayload.content, failedPayload.idempotencyKey);
    if (onClearFailedPayload) onClearFailedPayload();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-2">
      {/* Failed Payload Retry Banner */}
      {failedPayload && (
        <div className="bg-red-100 border-2 border-black p-2.5 flex items-center justify-between gap-3 text-xs font-bold text-red-900 shadow-[2px_2px_0px_#000] animate-in fade-in duration-150">
          <div className="flex items-center gap-2 overflow-hidden">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="truncate">
              Error de red al enviar: &ldquo;{failedPayload.content}&rdquo;
            </span>
          </div>
          <button
            type="button"
            onClick={handleRetryFailed}
            disabled={isDisabled}
            aria-label="Reintentar con la misma Idempotency-Key"
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-300 hover:bg-amber-200 text-black border border-black font-black uppercase text-[11px] shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer shrink-0 disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Reintentar (Misma Clave)</span>
          </button>
        </div>
      )}

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3 items-center">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isDisabled}
          className="flex-1 px-4 py-3 bg-white border-2 border-black font-medium text-sm text-black placeholder:text-zinc-500 shadow-[3px_3px_0px_#000] focus:outline-none focus:shadow-[5px_5px_0px_#000] transition-all disabled:bg-zinc-100 disabled:opacity-75"
        />

        <button
          type="submit"
          disabled={isSubmitDisabled}
          aria-label="Enviar mensaje"
          className="inline-flex items-center gap-2 px-5 py-3 bg-sky-400 hover:bg-sky-300 text-black font-black uppercase text-xs tracking-wider border-2 border-black shadow-[4px_4px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_#000] transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
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
    </div>
  );
};
