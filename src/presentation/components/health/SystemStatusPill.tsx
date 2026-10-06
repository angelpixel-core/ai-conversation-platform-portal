import React from 'react';
import { SystemHealth } from '@/domain/health/SystemHealth';

interface SystemStatusPillProps {
  health: SystemHealth;
  onClick?: () => void;
}

export const SystemStatusPill: React.FC<SystemStatusPillProps> = ({ health, onClick }) => {
  const isHealthy = health.status === 'HEALTHY';
  const isDegraded = health.status === 'DEGRADED';
  const isDown = health.status === 'DOWN';

  const statusText = isHealthy
    ? 'SISTEMA ONLINE'
    : isDegraded
    ? 'SISTEMA DEGRADADO'
    : isDown
    ? 'SIN CONEXIÓN'
    : 'VERIFICANDO...';

  const bgClasses = isHealthy
    ? 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-200'
    : isDegraded
    ? 'bg-amber-100 text-amber-950 dark:bg-amber-950/40 dark:text-amber-200'
    : isDown
    ? 'bg-red-100 text-red-950 dark:bg-red-950/40 dark:text-red-200'
    : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';

  const dotClasses = isHealthy
    ? 'bg-[#10B981] animate-pulse'
    : isDegraded
    ? 'bg-[#F59E0B] animate-pulse'
    : isDown
    ? 'bg-[#EF4444]'
    : 'bg-[#64748B]';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Estado del sistema: ${statusText} (${health.latencyMs}ms)`}
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded border-2 border-black dark:border-white shadow-neo-sm transition-all hover:-translate-y-0.5 hover:shadow-neo active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer select-none ${bgClasses}`}
    >
      <span
        aria-hidden="true"
        className={`w-2.5 h-2.5 rounded-full border border-black dark:border-white shrink-0 ${dotClasses}`}
      />
      <span>{statusText}</span>
      {health.latencyMs > 0 && isHealthy && (
        <span aria-hidden="true" className="font-mono text-[10px] opacity-75">
          {health.latencyMs}ms
        </span>
      )}
    </button>
  );
};
