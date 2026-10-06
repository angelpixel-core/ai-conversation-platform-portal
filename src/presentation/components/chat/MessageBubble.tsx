import React from 'react';
import { Message } from '@/domain/conversations/Message';
import { Bot, User, Clock, CheckCheck } from 'lucide-react';

export interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.isUser;
  const isOptimistic = message.status === 'optimistic';

  return (
    <div className={`flex gap-3 mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-none border-2 border-black bg-amber-300 text-black shadow-neo-xs flex items-center justify-center shrink-0">
          <Bot className="w-4 h-4 stroke-[2.5]" />
        </div>
      )}

      <div
        className={`max-w-[80%] sm:max-w-[70%] border-2 border-black p-3.5 shadow-neo-sm relative ${
          isUser
            ? isOptimistic
              ? 'bg-sky-100 border-dashed text-black'
              : 'bg-sky-200 text-black'
            : 'bg-amber-50 text-black'
        }`}
      >
        <div className="flex items-center justify-between gap-3 mb-1 text-[10px] font-mono font-black uppercase text-black/70">
          <span className="flex items-center gap-1">
            {isUser ? 'TÚ' : 'ASISTENTE IA'}
          </span>
          <span className="flex items-center gap-1">
            {isOptimistic ? (
              <span className="inline-flex items-center gap-1 text-amber-700 animate-pulse">
                <Clock className="w-3 h-3" /> Enviando...
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-black/60">
                <CheckCheck className="w-3 h-3" />
                {message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </span>
        </div>

        <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap select-text">
          {message.content}
        </p>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-none border-2 border-black bg-sky-300 text-black shadow-neo-xs flex items-center justify-center shrink-0">
          <User className="w-4 h-4 stroke-[2.5]" />
        </div>
      )}
    </div>
  );
};
