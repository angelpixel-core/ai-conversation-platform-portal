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

  const isLive = health.mode === 'LIVE';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Estado del sistema: ${statusText} (${health.latencyMs}ms, Modo ${health.mode})`}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded border-2 border-black dark:border-white bg-white dark:bg-zinc-900 text-black dark:text-white shadow-neo-sm hover:shadow-neo hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer select-none group"
    >
      {/* Beacon dot */}
      <span className="relative flex h-2.5 w-2.5 items-center justify-center">
        {isHealthy && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 border border-black dark:border-white ${
            isHealthy
              ? 'bg-emerald-500'
              : isDegraded
              ? 'bg-amber-500'
              : isDown
              ? 'bg-rose-500'
              : 'bg-zinc-400'
          }`}
        />
      </span>

      {/* Main Status Text */}
      <span className="font-extrabold tracking-tight">{statusText}</span>

      {/* Origin / Mode Badge */}
      <span
        className={`px-1.5 py-0.5 text-[10px] font-mono font-black rounded border border-black dark:border-zinc-700 ${
          isLive
            ? 'bg-blue-200 text-blue-950 dark:bg-blue-900/60 dark:text-blue-200'
            : 'bg-amber-200 text-amber-950 dark:bg-amber-900/60 dark:text-amber-200'
        }`}
      >
        {isLive ? 'LIVE' : 'MOCK'}
      </span>

      {/* Latency Pill */}
      {health.latencyMs > 0 && !isDown && (
        <span
          className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700"
          title={`Calidad de conexión: ${health.latencyQuality}`}
        >
          {health.latencyMs}ms
        </span>
      )}
    </button>
  );
};

