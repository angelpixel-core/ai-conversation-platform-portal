'use client';

import React from 'react';
import { useConversation } from '@/application/conversations/useConversation';
import { useSendMessage } from '@/application/conversations/useSendMessage';
import { ChatTimeline } from './ChatTimeline';
import { ChatInput } from './ChatInput';
import { ShieldCheck, MessageSquare, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

export interface ChatConsoleProps {
  conversationId?: string;
}

const QUICK_PROMPTS = [
  '☕ Ver Café del Día',
  '🥪 Carta de Pastelería',
  '🥛 Opciones con Leche Vegetal',
  '📦 Estado de mi Pedido',
];

export const ChatConsole: React.FC<ChatConsoleProps> = ({
  conversationId = 'conv-cloud-1',
}) => {
  const { data: conversation, isLoading, isError, refetch } = useConversation(conversationId);
  const sendMessageMutation = useSendMessage(conversationId);

  const handleSendMessage = (content: string) => {
    sendMessageMutation.mutate(content);
  };

  const messages = conversation?.messages || [];
  const canAppend = conversation?.canAppendUserMessage ?? true;
  const isWaitingAssistant = sendMessageMutation.isPending || !canAppend;

  return (
    <div className="flex flex-col h-[650px] bg-white border-4 border-black shadow-neo-lg text-black overflow-hidden">
      {/* Console Header */}
      <div className="bg-amber-300 border-b-4 border-black p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white border-2 border-black shadow-neo-xs">
            <MessageSquare className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wide">
                {conversation?.title || 'Consola Conversacional'}
              </h2>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-black uppercase bg-black text-white">
                {conversationId}
              </span>
            </div>
            <p className="text-xs font-mono font-bold text-black/80 flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-800" /> Idempotencia Activa (UUIDv4)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          aria-label="Refrescar conversación"
          className="p-1.5 bg-white border-2 border-black shadow-neo-xs hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* Turn Lock Banner (if awaiting response) */}
      {isWaitingAssistant && (
        <div className="bg-amber-100 border-b-2 border-black px-4 py-1.5 flex items-center gap-2 text-xs font-mono font-black uppercase text-amber-950">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span>Generando respuesta del Asistente (Turno Protegido)...</span>
        </div>
      )}

      {/* Error Banner */}
      {isError && (
        <div className="bg-red-100 border-b-2 border-black px-4 py-2 flex items-center gap-2 text-xs font-bold text-red-900">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>Error al conectar con la conversación. Comprueba tu conexión al backend.</span>
        </div>
      )}

      {/* Messages Timeline */}
      <ChatTimeline messages={messages} isLoading={isLoading} />

      {/* Quick Prompts Suggestions */}
      <div className="px-4 py-2 border-t-2 border-black bg-zinc-50 flex items-center gap-2 overflow-x-auto shrink-0">
        <span className="text-[10px] font-black uppercase font-mono text-zinc-500 shrink-0">
          Sugerencias:
        </span>
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={sendMessageMutation.isPending}
            onClick={() => handleSendMessage(prompt)}
            className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-yellow-200 border border-black shadow-neo-xs hover:shadow-none transition-all whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-3 sm:p-4 border-t-4 border-black bg-white shrink-0">
        <ChatInput
          onSendMessage={handleSendMessage}
          isSubmitting={sendMessageMutation.isPending}
          disabled={!canAppend}
          placeholder={
            !canAppend
              ? 'Esperando a que el asistente responda...'
              : 'Escribe tu consulta sobre café, menú o pedidos...'
          }
        />
      </div>
    </div>
  );
};
