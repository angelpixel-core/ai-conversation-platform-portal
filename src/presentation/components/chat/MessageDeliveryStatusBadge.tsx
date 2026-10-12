import React from 'react';
import { DeliveryStatus } from '@/domain/messaging/DeliveryStatus';

interface MessageDeliveryStatusBadgeProps {
  status: DeliveryStatus;
  workerId?: string;
  queue?: string;
  errorMessage?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export const MessageDeliveryStatusBadge: React.FC<MessageDeliveryStatusBadgeProps> = ({
  status,
  workerId,
  queue,
  errorMessage,
  onRetry,
  isRetrying = false,
}) => {
  const configs: Record<
    DeliveryStatus,
    { text: string; bg: string; icon: string; title: string }
  > = {
    PENDING_OUTBOX: {
      text: 'Outbox (MSSQL)',
      bg: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100',
      icon: '⏳',
      title: 'Persistido transaccionalmente en outbox_messages. Esperando sondeo del relay.',
    },
    QUEUED_BROKER: {
      text: queue ? `RabbitMQ (${queue})` : 'Encolado (RabbitMQ)',
      bg: 'bg-[#FEF3C7] text-amber-950',
      icon: '⚡',
      title: 'Publicado en RabbitMQ Topic Exchange. En cola de procesamiento LLM.',
    },
    PROCESSING_WORKER: {
      text: workerId ? `Worker (${workerId})` : 'Worker procesando...',
      bg: 'bg-[#DBEAFE] text-blue-950',
      icon: '⚙️',
      title: 'Worker autónomo consumió el mensaje y está ejecutando inferencia.',
    },
    COMPLETED: {
      text: 'Entregado',
      bg: 'bg-[#D1FAE5] text-emerald-950',
      icon: '✓',
      title: 'Ciclo asíncrono completado con éxito.',
    },
    FAILED_DLQ: {
      text: errorMessage ? `DLQ: ${errorMessage}` : 'Error en Worker (DLQ)',
      bg: 'bg-[#FEE2E2] text-red-950',
      icon: '✕',
      title: 'Desviado a Dead Letter Queue (conversation.dlx). Requiere intervención o reintento.',
    },
  };

  const current = configs[status] || configs.PENDING_OUTBOX;

  return (
    <div
      role="status"
      title={current.title}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider border-2 border-black dark:border-white shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] rounded-none transition-all ${current.bg}`}
    >
      <span className={status === 'PROCESSING_WORKER' ? 'animate-spin inline-block' : ''}>
        {current.icon}
      </span>
      <span>{current.text}</span>

      {status === 'FAILED_DLQ' && onRetry && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRetry();
          }}
          disabled={isRetrying}
          className="ml-1 px-1.5 py-0.5 bg-black text-white dark:bg-white dark:text-black font-black text-[10px] uppercase border border-black shadow-[1px_1px_0px_#000] active:translate-y-0.5 hover:bg-red-700 disabled:opacity-50"
        >
          {isRetrying ? 'Reintentando...' : 'Reintentar'}
        </button>
      )}
    </div>
  );
};
