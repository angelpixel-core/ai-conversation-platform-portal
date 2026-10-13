'use client';

import React, { useState, useRef } from 'react';
import { useTenant } from '@/application/tenants/TenantContext';
import { useConversationStream } from '@/application/streaming/useConversationStream';
import { StreamingGateway } from '@/domain/streaming/StreamingGateway';
import { MockStreamingGateway } from '@/infrastructure/api/MockStreamingGateway';
import { StreamingChatBubble } from './StreamingChatBubble';
import { StreamRecoveryBanner } from './StreamRecoveryBanner';
import {
  Play,
  RotateCcw,
  Zap,
  Activity,
  Wifi,
  Square,
  Radio,
  Clock,
  Terminal,
} from 'lucide-react';

export interface StreamingMonitorPanelProps {
  gateway?: StreamingGateway;
  conversationId?: string;
  tenantId?: string;
}

export const StreamingMonitorPanel: React.FC<StreamingMonitorPanelProps> = ({
  gateway: externalGateway,
  conversationId = 'conv-stream-1',
  tenantId: propTenantId,
}) => {
  let sessionTenantId = 'corp-acme';
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const tenantCtx = useTenant();
    if (tenantCtx?.activeTenant?.id?.value) {
      sessionTenantId = tenantCtx.activeTenant.id.value;
    }
  } catch {
    // Fallback if rendered outside TenantProvider
  }

  const tenantId = propTenantId || sessionTenantId;

  const mockGatewayRef = useRef<MockStreamingGateway | null>(null);
  if (!mockGatewayRef.current) {
    mockGatewayRef.current = new MockStreamingGateway({ tokenDelayMs: 45 });
  }

  const activeGateway = externalGateway ?? mockGatewayRef.current;

  const {
    status,
    accumulatedText,
    lastEventId,
    tokensCount,
    ttftMs,
    reconnectCount,
    isStreaming,
    isReconnecting,
    startStream,
    resumeStream,
    abortStream,
    resetStream,
  } = useConversationStream({
    conversationId,
    tenantId,
    gateway: activeGateway,
  });

  const [simulatedDropArmed, setSimulatedDropArmed] = useState(false);

  const handleSimulateDrop = async () => {
    if (activeGateway instanceof MockStreamingGateway) {
      activeGateway.setDropAtSequence(4);
    }
    setSimulatedDropArmed(true);
    await startStream();
  };

  const handleResume = async () => {
    if (activeGateway instanceof MockStreamingGateway) {
      activeGateway.setDropAtSequence(null);
    }
    setSimulatedDropArmed(false);
    await resumeStream();
  };

  const handleStartNormal = async () => {
    if (activeGateway instanceof MockStreamingGateway) {
      activeGateway.setDropAtSequence(null);
    }
    setSimulatedDropArmed(false);
    await startStream();
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'STREAMING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-400 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_#000] text-black">
            <span className="w-2 h-2 rounded-full bg-black animate-ping" />
            TRANSMITIENDO EN VIVO
          </span>
        );
      case 'RECONNECTING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-400 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_#000] text-black animate-pulse">
            <span className="w-2 h-2 rounded-full bg-black" />
            RECONECTANDO STREAM
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-300 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_#000] text-black">
            ✓ FLUJO COMPLETADO
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-400 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_#000] text-black">
            ✕ CANCELADO / ERROR
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-zinc-200 border-2 border-black font-black text-xs uppercase text-zinc-800">
            EN ESPERA (IDLE)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title Header Card */}
      <div className="bg-white border-4 border-black p-6 shadow-neo-lg relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-black text-amber-300 font-mono text-xs font-black uppercase">
                CU-08 • STEP 4 BACKEND
              </span>
              <span className="px-2 py-0.5 bg-indigo-200 text-black border border-black font-mono text-xs font-black uppercase">
                SLICE 2 & 5 (SSE STREAM & RECOVERY)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black flex items-center gap-2">
              <Radio className="w-7 h-7 text-indigo-600 stroke-[2.5]" />
              Streaming en Tiempo Real Resiliente vía SSE
            </h1>
            <p className="text-sm font-medium text-black/80 max-w-2xl leading-relaxed">
              Transmisión progresiva de respuestas token-a-token a 60 FPS con cursor terminal parpadeante
              y recuperación automática ante cortes de red mediante cabeceras <code>Last-Event-ID</code>.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            {getStatusBadge()}
            <span className="font-mono text-xs font-bold text-gray-600">
              Canal: <code>/conversations/{conversationId}/stream</code>
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Telemetry Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border-4 border-black p-4 shadow-neo">
          <div className="flex items-center justify-between text-zinc-600">
            <span className="font-mono text-xs font-black uppercase">Tokens Generados</span>
            <Activity className="w-4 h-4 text-black stroke-[2.5]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono mt-2 text-black">
            {tokensCount}
          </div>
          <span className="text-[11px] font-bold text-zinc-500 uppercase mt-1 block">
            Renderizado por lotes
          </span>
        </div>

        <div className="bg-white border-4 border-black p-4 shadow-neo">
          <div className="flex items-center justify-between text-zinc-600">
            <span className="font-mono text-xs font-black uppercase">Time-to-First-Token</span>
            <Clock className="w-4 h-4 text-black stroke-[2.5]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono mt-2 text-black">
            {ttftMs !== null ? `${ttftMs}ms` : '—'}
          </div>
          <span className="text-[11px] font-bold text-zinc-500 uppercase mt-1 block">
            Latencia inicial TTFT
          </span>
        </div>

        <div className="bg-white border-4 border-black p-4 shadow-neo">
          <div className="flex items-center justify-between text-zinc-600">
            <span className="font-mono text-xs font-black uppercase">Last-Event-ID</span>
            <Terminal className="w-4 h-4 text-black stroke-[2.5]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono mt-2 text-black">
            {lastEventId !== null ? `#${lastEventId}` : '—'}
          </div>
          <span className="text-[11px] font-bold text-zinc-500 uppercase mt-1 block">
            Offset para Stream Recovery
          </span>
        </div>

        <div className="bg-white border-4 border-black p-4 shadow-neo">
          <div className="flex items-center justify-between text-zinc-600">
            <span className="font-mono text-xs font-black uppercase">Reconexiones</span>
            <Wifi className="w-4 h-4 text-black stroke-[2.5]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono mt-2 text-black">
            {reconnectCount}
          </div>
          <span className="text-[11px] font-bold text-zinc-500 uppercase mt-1 block">
            {reconnectCount > 0 ? 'Recuperado sin duplicación' : 'Conexión estable'}
          </span>
        </div>
      </div>

      {/* Action Controls Toolbar */}
      <div className="bg-[#FFFDF8] border-4 border-black p-4 shadow-neo flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={isStreaming}
            onClick={handleStartNormal}
            className="px-4 py-2 bg-yellow-300 hover:bg-yellow-200 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-black stroke-[2]" />
            Iniciar Streaming
          </button>

          <button
            type="button"
            disabled={isStreaming}
            onClick={handleSimulateDrop}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Zap className="w-4 h-4 text-black stroke-[2.5]" />
            Simular Corte de Red (Secuencia #4)
          </button>

          {isReconnecting && (
            <button
              type="button"
              onClick={handleResume}
              className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center gap-2 cursor-pointer animate-bounce"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.5]" />
              Reanudar con Last-Event-ID
            </button>
          )}

          {isStreaming && (
            <button
              type="button"
              onClick={abortStream}
              className="px-4 py-2 bg-rose-400 hover:bg-rose-300 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center gap-2 cursor-pointer"
            >
              <Square className="w-4 h-4 fill-black stroke-[2]" />
              Detener Stream
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={resetStream}
          className="px-3 py-2 bg-white hover:bg-zinc-100 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
          Reiniciar
        </button>
      </div>

      {/* Stream Recovery Alert Banner */}
      <StreamRecoveryBanner
        isReconnecting={isReconnecting}
        lastEventId={lastEventId}
        onResume={handleResume}
      />

      {/* Live Assistant Streaming Chat Bubble */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-black uppercase text-zinc-600">
            Vista Previa en Vivo del Canal de Streaming:
          </span>
          {simulatedDropArmed && (
            <span className="px-2 py-0.5 bg-amber-200 border border-black font-mono text-[10px] font-black uppercase">
              Modo Falla Armada (Interrupción en #4)
            </span>
          )}
        </div>

        <StreamingChatBubble
          text={accumulatedText}
          isStreaming={isStreaming}
          tokensCount={tokensCount}
          ttftMs={ttftMs}
        />
      </div>
    </div>
  );
};
