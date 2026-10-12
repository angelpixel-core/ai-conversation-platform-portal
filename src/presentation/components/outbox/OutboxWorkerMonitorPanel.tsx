'use client';

import React, { useState } from 'react';
import { DeliveryStatus } from '@/domain/messaging/DeliveryStatus';
import { MessageDeliveryStatusBadge } from '@/presentation/components/chat/MessageDeliveryStatusBadge';
import {
  Cpu,
  Database,
  Radio,
  Server,
  AlertOctagon,
  RefreshCw,
  Play,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface OutboxEventItem {
  id: string;
  messageId: string;
  status: DeliveryStatus;
  timestamp: string;
  queue: string;
  workerId?: string;
  latencyMs?: number;
  errorMessage?: string;
}

const INITIAL_EVENTS: OutboxEventItem[] = [
  {
    id: 'evt-01',
    messageId: 'msg-outbox-101',
    status: 'COMPLETED',
    timestamp: 'Hace 2 min',
    queue: 'conversation.llm_processing.queue',
    workerId: 'worker-node-1',
    latencyMs: 142,
  },
  {
    id: 'evt-02',
    messageId: 'msg-outbox-102',
    status: 'PROCESSING_WORKER',
    timestamp: 'Hace 45s',
    queue: 'conversation.llm_processing.queue',
    workerId: 'worker-node-2',
    latencyMs: 88,
  },
  {
    id: 'evt-03',
    messageId: 'msg-outbox-103',
    status: 'QUEUED_BROKER',
    timestamp: 'Hace 12s',
    queue: 'conversation.events',
  },
  {
    id: 'evt-04',
    messageId: 'msg-outbox-104',
    status: 'PENDING_OUTBOX',
    timestamp: 'Hace 3s',
    queue: 'outbox_messages_mssql',
  },
];

export const OutboxWorkerMonitorPanel: React.FC = () => {
  const [events, setEvents] = useState<OutboxEventItem[]>(INITIAL_EVENTS);
  const [isSimulating, setIsSimulating] = useState(false);

  // Simulation: Happy Path
  const handleSimulateHappyPath = () => {
    setIsSimulating(true);
    const newId = `msg-sim-${Date.now().toString().slice(-4)}`;
    const newEvent: OutboxEventItem = {
      id: `evt-${Date.now()}`,
      messageId: newId,
      status: 'PENDING_OUTBOX',
      timestamp: 'Ahora',
      queue: 'outbox_messages_mssql',
    };

    setEvents((prev) => [newEvent, ...prev]);

    // Advance to QUEUED_BROKER
    setTimeout(() => {
      setEvents((prev) =>
        prev.map((e) =>
          e.messageId === newId
            ? { ...e, status: 'QUEUED_BROKER', queue: 'conversation.events' }
            : e
        )
      );
    }, 600);

    // Advance to PROCESSING_WORKER
    setTimeout(() => {
      setEvents((prev) =>
        prev.map((e) =>
          e.messageId === newId
            ? {
                ...e,
                status: 'PROCESSING_WORKER',
                workerId: 'worker-node-alpha',
                queue: 'conversation.llm_processing.queue',
              }
            : e
        )
      );
    }, 1400);

    // Advance to COMPLETED
    setTimeout(() => {
      setEvents((prev) =>
        prev.map((e) =>
          e.messageId === newId
            ? { ...e, status: 'COMPLETED', latencyMs: 310 }
            : e
        )
      );
      setIsSimulating(false);
    }, 2200);
  };

  // Simulation: DLQ Incident
  const handleSimulateDlqIncident = () => {
    const dlqId = `msg-dlq-${Date.now().toString().slice(-4)}`;
    const dlqEvent: OutboxEventItem = {
      id: `evt-${Date.now()}`,
      messageId: dlqId,
      status: 'FAILED_DLQ',
      timestamp: 'Ahora',
      queue: 'conversation.dlx',
      workerId: 'worker-node-beta',
      errorMessage: 'RabbitMQ Consumer Timeout: Model Provider 504 Gateway Timeout',
    };

    setEvents((prev) => [dlqEvent, ...prev]);
  };

  // Retry action on a DLQ item
  const handleRetryItem = (messageId: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.messageId === messageId
          ? {
              ...e,
              status: 'PENDING_OUTBOX',
              queue: 'outbox_messages_mssql',
              errorMessage: undefined,
            }
          : e
      )
    );

    // Progress back to healthy execution
    setTimeout(() => {
      setEvents((prev) =>
        prev.map((e) =>
          e.messageId === messageId
            ? {
                ...e,
                status: 'QUEUED_BROKER',
                queue: 'conversation.events',
              }
            : e
        )
      );
    }, 800);

    setTimeout(() => {
      setEvents((prev) =>
        prev.map((e) =>
          e.messageId === messageId
            ? {
                ...e,
                status: 'COMPLETED',
                latencyMs: 195,
              }
            : e
        )
      );
    }, 1800);
  };

  return (
    <div className="flex flex-col bg-white border-4 border-black shadow-neo-lg text-black overflow-hidden space-y-6 p-4 sm:p-6">
      {/* Panel Header */}
      <div className="bg-purple-300 border-2 border-black p-4 shadow-neo-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white border-2 border-black shadow-neo-xs">
            <Cpu className="w-6 h-6 stroke-[2.5] text-purple-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-wide text-black">
                Monitor de Despacho Asíncrono & Outbox
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono font-black uppercase bg-black text-purple-300">
                CU-04 STEP 6
              </span>
            </div>
            <p className="text-xs font-mono font-bold text-black/80 flex items-center gap-1.5 mt-0.5">
              <Radio className="w-3.5 h-3.5 text-purple-900 animate-pulse" /> Ciclo de Vida: Transactional Outbox (MSSQL) ➔ RabbitMQ ➔ Worker IA
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            disabled={isSimulating}
            onClick={handleSimulateHappyPath}
            aria-label="Simular Flujo Completo"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-400 text-black font-black uppercase text-xs border-2 border-black shadow-neo hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {isSimulating ? 'Simulando...' : 'Simular Flujo Completo'}
          </button>

          <button
            type="button"
            onClick={handleSimulateDlqIncident}
            aria-label="Simular Incidente DLQ"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-400 text-black font-black uppercase text-xs border-2 border-black shadow-neo hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            Simular Incidente DLQ
          </button>
        </div>
      </div>

      {/* Architecture Infrastructure Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: SQL Server Outbox */}
        <div className="border-2 border-black p-3.5 bg-slate-50 shadow-neo-sm space-y-1.5">
          <div className="flex items-center justify-between text-xs font-black uppercase font-mono text-slate-700">
            <span className="flex items-center gap-1.5">
              <Database className="w-4 h-4 text-slate-800" /> MSSQL Outbox
            </span>
            <span className="px-1.5 py-0.5 bg-slate-200 border border-black text-[10px]">TABLA</span>
          </div>
          <p className="font-mono text-xs font-black text-black">outbox_messages</p>
          <p className="text-[11px] text-zinc-600 font-medium">
            Polling atómico con <code className="bg-slate-200 px-1 font-bold">UPDLOCK, READPAST</code>.
          </p>
        </div>

        {/* Card 2: RabbitMQ Broker */}
        <div className="border-2 border-black p-3.5 bg-amber-50 shadow-neo-sm space-y-1.5">
          <div className="flex items-center justify-between text-xs font-black uppercase font-mono text-amber-900">
            <span className="flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-amber-800" /> RabbitMQ Topic
            </span>
            <span className="px-1.5 py-0.5 bg-amber-300 border border-black text-[10px]">EXCHANGE</span>
          </div>
          <p className="font-mono text-xs font-black text-amber-950 truncate">
            conversation.events
          </p>
          <p className="text-[11px] text-zinc-600 font-medium">
            Cola: <code className="bg-amber-200 px-1 font-bold">conversation.llm_processing.queue</code>
          </p>
        </div>

        {/* Card 3: Autonomous Workers */}
        <div className="border-2 border-black p-3.5 bg-blue-50 shadow-neo-sm space-y-1.5">
          <div className="flex items-center justify-between text-xs font-black uppercase font-mono text-blue-900">
            <span className="flex items-center gap-1.5">
              <Server className="w-4 h-4 text-blue-800" /> Pool de Workers
            </span>
            <span className="px-1.5 py-0.5 bg-blue-200 border border-black text-[10px]">ACTIVOS: 3</span>
          </div>
          <p className="font-mono text-xs font-black text-blue-950">
            worker-node-[1..3]
          </p>
          <p className="text-[11px] text-zinc-600 font-medium">
            Inferencia desacoplada y buffering de chunks SSE.
          </p>
        </div>

        {/* Card 4: Dead Letter Queue */}
        <div className="border-2 border-black p-3.5 bg-red-50 shadow-neo-sm space-y-1.5">
          <div className="flex items-center justify-between text-xs font-black uppercase font-mono text-red-900">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-800" /> Dead Letter (DLQ)
            </span>
            <span className="px-1.5 py-0.5 bg-red-200 border border-black text-[10px]">RECOVERY</span>
          </div>
          <p className="font-mono text-xs font-black text-red-950">
            conversation.dlx
          </p>
          <p className="text-[11px] text-zinc-600 font-medium">
            Desvío tras agotamiento de reintentos con recuperación táctil.
          </p>
        </div>
      </div>

      {/* Pipeline Lifecycle Visualizer */}
      <div className="border-2 border-black p-4 bg-zinc-50 shadow-neo-sm space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider font-mono text-zinc-700">
          Flujo de Estados de Entrega (Finite State Machine)
        </h3>
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 border-2 border-black shadow-neo-xs">
            <span>⏳</span> <span>PENDING_OUTBOX</span>
          </div>
          <ArrowRight className="w-4 h-4 stroke-[3] text-black shrink-0" />

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-100 border-2 border-black shadow-neo-xs">
            <span>⚡</span> <span>QUEUED_BROKER</span>
          </div>
          <ArrowRight className="w-4 h-4 stroke-[3] text-black shrink-0" />

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-100 border-2 border-black shadow-neo-xs">
            <span>⚙️</span> <span>PROCESSING_WORKER</span>
          </div>
          <ArrowRight className="w-4 h-4 stroke-[3] text-black shrink-0" />

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-100 border-2 border-black shadow-neo-xs">
            <span>✓</span> <span>COMPLETED</span>
          </div>

          <span className="text-zinc-400 font-normal mx-1">|</span>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-100 border-2 border-black shadow-neo-xs text-red-950">
            <span>✕</span> <span>FAILED_DLQ (Fallback Reintentable)</span>
          </div>
        </div>
      </div>

      {/* Events Stream Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider font-mono text-zinc-700 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Línea de Eventos de Despacho en Vivo
          </h3>
          <span className="text-[11px] font-mono text-zinc-500 font-bold">
            Total Registrados: {events.length}
          </span>
        </div>

        <div className="border-2 border-black shadow-neo-sm overflow-x-auto bg-white">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-amber-200 border-b-2 border-black font-mono font-black uppercase text-[11px]">
                <th className="p-2.5 border-r border-black">Hora</th>
                <th className="p-2.5 border-r border-black">Message ID</th>
                <th className="p-2.5 border-r border-black">Destino / Cola</th>
                <th className="p-2.5 border-r border-black">Estado de Entrega</th>
                <th className="p-2.5 border-r border-black">Worker Node</th>
                <th className="p-2.5">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/20 font-mono">
              {events.map((evt) => (
                <tr key={evt.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="p-2.5 border-r border-black/20 text-zinc-600 font-bold whitespace-nowrap">
                    {evt.timestamp}
                  </td>
                  <td className="p-2.5 border-r border-black/20 font-black text-black">
                    {evt.messageId}
                  </td>
                  <td className="p-2.5 border-r border-black/20 text-zinc-700 font-medium">
                    <code>{evt.queue}</code>
                  </td>
                  <td className="p-2.5 border-r border-black/20">
                    <MessageDeliveryStatusBadge
                      status={evt.status}
                      workerId={evt.workerId}
                      queue={evt.queue}
                      errorMessage={evt.errorMessage}
                      onRetry={() => handleRetryItem(evt.messageId)}
                    />
                  </td>
                  <td className="p-2.5 border-r border-black/20 text-zinc-600 font-bold">
                    {evt.workerId ? (
                      <span className="px-1.5 py-0.5 bg-blue-100 border border-black text-[10px] text-blue-950">
                        {evt.workerId}
                      </span>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="p-2.5 whitespace-nowrap">
                    {evt.status === 'FAILED_DLQ' ? (
                      <button
                        type="button"
                        onClick={() => handleRetryItem(evt.messageId)}
                        className="px-2 py-1 bg-red-400 hover:bg-red-500 text-black font-black uppercase text-[10px] border border-black shadow-[1px_1px_0px_#000] cursor-pointer"
                      >
                        Reintentar
                      </button>
                    ) : (
                      <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> OK
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
