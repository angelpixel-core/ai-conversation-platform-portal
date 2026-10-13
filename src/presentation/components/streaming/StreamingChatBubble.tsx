import React from 'react';
import { Bot, CheckCircle2 } from 'lucide-react';
import { TypingBlinkCursor } from './TypingBlinkCursor';

export interface StreamingChatBubbleProps {
  text: string;
  isStreaming: boolean;
  tokensCount: number;
  ttftMs?: number | null;
}

export const StreamingChatBubble: React.FC<StreamingChatBubbleProps> = ({
  text,
  isStreaming,
  tokensCount,
  ttftMs,
}) => {
  return (
    <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_#000] space-y-3">
      {/* Bubble Header */}
      <div className="flex items-center justify-between border-b-2 border-black/20 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-amber-300 border-2 border-black flex items-center justify-center shadow-[1px_1px_0px_#000]">
            <Bot className="w-4 h-4 text-black stroke-[2.5]" />
          </div>
          <div>
            <span className="font-black text-xs uppercase tracking-tight text-black">
              Asistente de Barista (IA)
            </span>
            <span className="ml-2 font-mono text-[10px] text-gray-500 uppercase">
              SSE Stream Channel
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {ttftMs !== undefined && ttftMs !== null && (
            <span className="font-mono text-[11px] font-bold bg-cyan-100 border border-black px-1.5 py-0.5">
              TTFT: {ttftMs}ms
            </span>
          )}
          <span className="font-mono text-xs font-black bg-black text-white px-2 py-0.5">
            {tokensCount} tokens
          </span>
          {!isStreaming && tokensCount > 0 && (
            <span className="inline-flex items-center gap-1 bg-emerald-400 border border-black text-black font-black text-[11px] px-1.5 py-0.5 uppercase shadow-[1px_1px_0px_#000]">
              <CheckCircle2 className="w-3 h-3" /> Completado
            </span>
          )}
        </div>
      </div>

      {/* Bubble Message Body */}
      <div className="text-sm sm:text-base font-medium text-black leading-relaxed min-h-[60px] whitespace-pre-wrap">
        {text ? (
          <span>
            {text}
            {isStreaming && <TypingBlinkCursor />}
          </span>
        ) : isStreaming ? (
          <span className="text-gray-400 italic flex items-center gap-1">
            Esperando primer token del motor LLM...
            <TypingBlinkCursor />
          </span>
        ) : (
          <span className="text-gray-400 italic">
            Presiona &quot;Iniciar Streaming&quot; para abrir el canal de eventos SSE.
          </span>
        )}
      </div>
    </div>
  );
};
