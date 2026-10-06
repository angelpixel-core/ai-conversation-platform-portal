import React, { useEffect } from 'react';
import { SystemHealth } from '@/domain/health/SystemHealth';
import { ExternalLink, RefreshCw, X, Server, Database, Activity, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export interface SystemStatusModalProps {
  isOpen: boolean;
  health: SystemHealth;
  onClose: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  apiUrl?: string;
}

export const SystemStatusModal: React.FC<SystemStatusModalProps> = ({
  isOpen,
  health,
  onClose,
  onRefresh,
  isRefreshing = false,
  apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isHealthy = health.status === 'HEALTHY';
  const isDegraded = health.status === 'DEGRADED';
  const isDown = health.status === 'DOWN';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="health-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-neo-lg p-6 relative flex flex-col gap-5 text-black dark:text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black dark:border-zinc-700 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h2 id="health-modal-title" className="text-xl font-black uppercase tracking-wider">
              Diagnóstico del Sistema
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1 border-2 border-black dark:border-white bg-amber-300 dark:bg-amber-400 text-black shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        {/* Global Summary Badge */}
        <div
          className={`border-2 border-black dark:border-white p-4 flex items-center justify-between shadow-neo-sm ${
            isHealthy
              ? 'bg-emerald-100 dark:bg-emerald-950/60'
              : isDegraded
              ? 'bg-amber-100 dark:bg-amber-950/60'
              : 'bg-red-100 dark:bg-red-950/60'
          }`}
        >
          <div className="flex items-center gap-3">
            {isHealthy && <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
            {isDegraded && <AlertTriangle className="w-6 h-6 text-amber-600" />}
            {isDown && <XCircle className="w-6 h-6 text-red-600" />}
            <div>
              <p className="text-xs font-mono font-bold uppercase opacity-80">Estado Operativo</p>
              <p className="text-base font-black">
                {isHealthy ? 'SISTEMA ONLINE (OPERATIVO)' : isDegraded ? 'SISTEMA DEGRADADO' : 'SIN CONEXIÓN'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-mono font-bold uppercase opacity-80">Latencia</p>
            <p className="text-base font-black font-mono">{health.latencyMs}ms</p>
          </div>
        </div>

        {/* Components Checks List */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest mb-2 opacity-80">
            Microservicios y Conectores
          </h3>
          <div className="space-y-2">
            {health.components.map((comp) => (
              <div
                key={comp.name}
                className="border-2 border-black dark:border-zinc-700 p-3 bg-zinc-50 dark:bg-zinc-800/80 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  {comp.name.includes('db') || comp.name.includes('database') ? (
                    <Database className="w-4 h-4 text-sky-600" />
                  ) : (
                    <Server className="w-4 h-4 text-violet-600" />
                  )}
                  <div>
                    <span className="font-bold font-mono text-sm uppercase">{comp.name}</span>
                    {comp.database && (
                      <span className="ml-2 text-xs font-mono px-1.5 py-0.5 bg-yellow-200 text-black border border-black font-bold">
                        {comp.database}
                      </span>
                    )}
                    {comp.message && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">{comp.message}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {comp.latencyMs !== undefined && (
                    <span className="text-xs font-mono font-bold text-zinc-500">
                      {comp.latencyMs}ms
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 text-[11px] font-black uppercase border border-black ${
                      comp.status === 'HEALTHY'
                        ? 'bg-emerald-300 text-black'
                        : comp.status === 'DEGRADED'
                        ? 'bg-amber-300 text-black'
                        : 'bg-red-400 text-black'
                    }`}
                  >
                    {comp.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Links to API Documentation & Refresh action */}
        <div className="pt-2 border-t-2 border-black dark:border-zinc-700 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2">
            <a
              href={`${apiUrl}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Swagger UI (/docs)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase bg-violet-200 dark:bg-violet-900 border-2 border-black dark:border-white shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
            >
              Swagger UI (/docs)
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href={`${apiUrl}/redoc`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="ReDoc (/redoc)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase bg-sky-200 dark:bg-sky-900 border-2 border-black dark:border-white shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
            >
              ReDoc (/redoc)
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase bg-yellow-300 dark:bg-yellow-400 text-black border-2 border-black shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refrescar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
