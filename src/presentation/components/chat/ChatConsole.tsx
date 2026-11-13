'use client';

import React, { useState } from 'react';
import { useConversation } from '@/application/conversations/useConversation';
import { useSendMessage, SendMessageVariables } from '@/application/conversations/useSendMessage';
import { useCreateConversation } from '@/application/conversations/useCreateConversation';
import { ChatTimeline } from './ChatTimeline';
import { ChatInput, FailedPayload } from './ChatInput';
import { CreateConversationModal } from './CreateConversationModal';
import {
  ShieldCheck,
  MessageSquare,
  MessageSquarePlus,
  RefreshCw,
  AlertCircle,
  Lock,
} from 'lucide-react';

export interface ChatConsoleProps {
  conversationId?: string;
}

const QUICK_PROMPTS = [
  '📊 Calcular presupuesto cloud',
  '🔒 Consultar política de seguridad',
  '📑 Resumen de arquitectura multi-tenant',
  '⚡ Ver cuota de tokens disponible',
];

export const ChatConsole: React.FC<ChatConsoleProps> = ({
  conversationId = 'conv-cloud-1',
}) => {
  const [activeConvId, setActiveConvId] = useState<string>(conversationId);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [failedPayload, setFailedPayload] = useState<FailedPayload | null>(null);

  const { data: conversation, isLoading, isError, refetch } = useConversation(activeConvId);
  const sendMessageMutation = useSendMessage(activeConvId);
  const createConversationMutation = useCreateConversation();

  const handleSendMessage = (content: string, idempotencyKey?: string) => {
    sendMessageMutation.mutate(
      idempotencyKey ? { content, idempotencyKey } : content,
      {
        onError: (_err) => {
          // If error occurs, retain payload so user can retry with the SAME idempotency key
          setFailedPayload({
            content,
            idempotencyKey: idempotencyKey || crypto.randomUUID(),
          });
        },
        onSuccess: () => {
          setFailedPayload(null);
        },
      }
    );
  };

  const handleCreateConversation = async (title: string) => {
    const result = await createConversationMutation.mutateAsync({ title });
    if (result?.id) {
      setActiveConvId(result.id);
    }
  };

  const messages = conversation?.messages || [];
  const canAppend = conversation?.canAppendUserMessage ?? true;
  const isWaitingAssistant = sendMessageMutation.isPending || !canAppend;

  return (
    <div className="flex flex-col h-[650px] bg-white border-4 border-black shadow-[6px_6px_0px_#000] text-black overflow-hidden">
      {/* Console Header */}
      <div className="bg-amber-300 border-b-4 border-black p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white border-2 border-black shadow-[2px_2px_0px_#000]">
            <MessageSquare className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wide">
                {conversation?.title || 'Consola Conversacional'}
              </h2>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-black uppercase bg-black text-white">
                {activeConvId}
              </span>
            </div>
            <p className="text-xs font-mono font-bold text-black/80 flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-800" /> Idempotencia Activa (UUIDv4)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Nueva Conversación Action */}
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            aria-label="Nueva Conversación"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 border-2 border-black font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer"
          >
            <MessageSquarePlus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden md:inline">Nueva Conversación</span>
          </button>

          {/* Refrescar Conversación */}
          <button
            type="button"
            onClick={() => refetch()}
            aria-label="Refrescar conversación"
            className="p-1.5 bg-white hover:bg-zinc-100 border-2 border-black shadow-[3px_3px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Turn Lock Banner (if awaiting response) */}
      {isWaitingAssistant && (
        <div className="bg-amber-100 border-b-2 border-black px-4 py-2 flex items-center justify-between text-xs font-mono font-black uppercase text-amber-950 shadow-[0_2px_0px_#000] animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            <Lock className="w-3.5 h-3.5 text-amber-900" />
            <span>Esperando respuesta del Asistente (Turno Protegido)...</span>
          </div>
          <span className="text-[10px] text-amber-800 font-bold hidden sm:inline">
            Invariante Activa: alternancia de turnos cliente-servidor
          </span>
        </div>
      )}

      {/* Error Banner */}
      {isError && (
        <div className="bg-red-100 border-b-2 border-black px-4 py-2 flex items-center gap-2 text-xs font-bold text-red-900 shadow-[0_2px_0px_#000]">
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
            disabled={sendMessageMutation.isPending || !canAppend}
            onClick={() => handleSendMessage(prompt)}
            className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-yellow-200 border-2 border-black shadow-[2px_2px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
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
          failedPayload={failedPayload}
          onClearFailedPayload={() => setFailedPayload(null)}
          placeholder={
            !canAppend
              ? 'Esperando a que el asistente responda...'
              : 'Escribe tu consulta sobre infraestructura, tokens o políticas...'
          }
        />
      </div>

      {/* Nueva Conversación Modal */}
      <CreateConversationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateConversation}
        isCreating={createConversationMutation.isPending}
      />
    </div>
  );
};
