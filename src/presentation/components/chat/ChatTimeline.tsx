import React, { useEffect, useRef } from 'react';
import { Message } from '@/domain/conversations/Message';
import { MessageBubble } from './MessageBubble';
import { Coffee, Sparkles } from 'lucide-react';

export interface ChatTimelineProps {
  messages: Message[];
  isLoading?: boolean;
}

export const ChatTimeline: React.FC<ChatTimelineProps> = ({ messages, isLoading = false }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof bottomRef.current?.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div className="p-4 bg-amber-100 border-2 border-black shadow-neo-sm font-mono text-xs font-bold animate-pulse">
          Cargando historial de conversación...
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
        <div className="w-12 h-12 bg-amber-200 border-2 border-black shadow-neo flex items-center justify-center">
          <Coffee className="w-6 h-6 stroke-[2.5]" />
        </div>
        <p className="font-black text-sm uppercase">Sin mensajes en este hilo</p>
        <p className="text-xs text-zinc-600 max-w-xs font-medium">
          Envía tu primer mensaje abajo para consultar la carta, hacer un pedido o verificar estado.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
};
