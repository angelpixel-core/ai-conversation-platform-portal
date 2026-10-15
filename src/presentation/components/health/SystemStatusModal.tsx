import React, { useEffect, useState } from 'react';
import { SystemHealth } from '@/domain/health/SystemHealth';
import {
  ExternalLink,
  RefreshCw,
  X,
  Server,
  Database,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Radio,
  Terminal,
  ShieldCheck,
  Cpu,
  Layers,
} from 'lucide-react';
import { runtimeEnvironmentStore } from '@/infrastructure/storage/runtimeEnvironmentStore';

export interface SystemStatusModalProps {
  isOpen: boolean;
  health: SystemHealth;
  onClose: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  apiUrl?: string;
  onToggleMode?: () => void;
}

export const SystemStatusModal: React.FC<SystemStatusModalProps> = ({
  isOpen,
  health,
  onClose,
  onRefresh,
  isRefreshing = false,
  apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  onToggleMode,
}) => {
  const [copied, setCopied] = useState(false);
  const [showRawPayload, setShowRawPayload] = useState(false);

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
  const isLive = health.mode === 'LIVE';

  const handleCopyJson = async () => {
    const jsonStr = JSON.stringify(health.rawPayload || { status: health.status }, null, 2);
    try {
      await navigator.clipboard.writeText(jsonStr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleToggle = () => {
    if (onToggleMode) {
      onToggleMode();
    } else {
      runtimeEnvironmentStore.toggleMode();
      if (onRefresh) onRefresh();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="health-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-950 border-4 border-black dark:border-white shadow-neo-xl p-6 relative flex flex-col gap-5 text-black dark:text-white"
      >
        {/* Header with Title and Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-black dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 border-2 border-black dark:border-white bg-emerald-400 text-black shadow-neo-sm">
              <Activity className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 id="health-modal-title" className="text-xl font-black uppercase tracking-wider">
                Diagnóstico del Sistema
              </h2>
              <p className="text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400">
                Observabilidad y Disponibilidad de Microservicios
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live / Mock Mechanical Toggle */}
            <div className="flex items-center border-2 border-black dark:border-white p-0.5 bg-zinc-100 dark:bg-zinc-900 shadow-neo-sm">
              <button
                type="button"
                onClick={() => {
                  if (!isLive) handleToggle();
                }}
                className={`px-3 py-1 text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
                  isLive
                    ? 'bg-blue-500 text-white border border-black shadow-neo-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                }`}
                aria-pressed={isLive}
              >
                <Radio className="w-3 h-3" />
                LIVE (8000)
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isLive) handleToggle();
                }}
                className={`px-3 py-1 text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
                  !isLive
                    ? 'bg-amber-400 text-black border border-black shadow-neo-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                }`}
                aria-pressed={!isLive}
              >
                <Cpu className="w-3 h-3" />
                MOCK
              </button>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar modal"
              className="p-1.5 border-2 border-black dark:border-white bg-rose-400 text-black shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Status & Latency Quality Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Operative Status Box */}
          <div
            className={`sm:col-span-2 border-3 border-black dark:border-white p-4 shadow-neo-sm flex items-center justify-between ${
              isHealthy
                ? 'bg-emerald-100 dark:bg-emerald-950/50'
                : isDegraded
                ? 'bg-amber-100 dark:bg-amber-950/50'
                : 'bg-rose-100 dark:bg-rose-950/50'
            }`}
          >
            <div className="flex items-center gap-3">
              {isHealthy && <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400 shrink-0" />}
              {isDegraded && <AlertTriangle className="w-7 h-7 text-amber-600 dark:text-amber-400 shrink-0" />}
              {isDown && <XCircle className="w-7 h-7 text-rose-600 dark:text-rose-400 shrink-0" />}
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider block opacity-75">
                  Estado Operativo Global
                </span>
                <span className="text-base font-black tracking-tight">
                  {isHealthy ? 'SISTEMA ONLINE (OPERATIVO)' : isDegraded ? 'SISTEMA DEGRADADO' : 'SIN CONEXIÓN'}
                </span>
              </div>
            </div>
            <span
              className={`px-2 py-1 text-xs font-mono font-black border-2 border-black dark:border-white uppercase ${
                isLive ? 'bg-blue-200 text-blue-950' : 'bg-amber-200 text-amber-950'
              }`}
            >
              {health.mode}
            </span>
          </div>

          {/* Latency Meter Box */}
          <div className="border-3 border-black dark:border-white p-4 bg-zinc-50 dark:bg-zinc-900 shadow-neo-sm flex flex-col justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider block text-zinc-500">
              Tiempo de Respuesta
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black font-mono">{health.latencyMs}ms</span>
              <span
                className={`text-[10px] font-black uppercase px-1.5 py-0.5 border border-black dark:border-white ${
                  health.latencyQuality === 'EXCELLENT'
                    ? 'bg-emerald-300 text-black'
                    : health.latencyQuality === 'GOOD'
                    ? 'bg-amber-300 text-black'
                    : 'bg-rose-300 text-black'
                }`}
              >
                {health.latencyQuality === 'EXCELLENT'
                  ? 'Óptima'
                  : health.latencyQuality === 'GOOD'
                  ? 'Buena'
                  : 'Alta'}
              </span>
            </div>
          </div>
        </div>

        {/* RFC-31 Contract Status Notice */}
        <div className="border-2 border-black dark:border-zinc-700 bg-amber-50 dark:bg-amber-950/30 p-3 shadow-neo-xs flex items-start gap-2.5 text-xs font-mono">
          <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-black text-amber-900 dark:text-amber-200 uppercase">
                {health.isRFC31Compliant ? 'RFC-31: CUMPLIDO (Checks Ricos)' : 'RFC-31: PROPUESTO EN BACKEND'}
              </span>
              <span className="text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 px-1 py-0.2 rounded border border-amber-400 font-bold">
                Uvicorn / FastAPI
              </span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400">
              {health.isRFC31Compliant
                ? 'El backend expone telemetría granular por conector con tiempos individuales.'
                : 'El motor responde {"status":"ok"}. El portal aplica Tolerant Reader para mapear la salud del stack.'}
            </p>
          </div>
        </div>

        {/* Microservices & Connectors Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
              Microservicios y Conectores de Infraestructura
            </h3>
            <span className="text-[10px] font-mono text-zinc-500">
              {health.components.length} verificados
            </span>
          </div>
          <div className="space-y-2">
            {health.components.map((comp) => (
              <div
                key={comp.name}
                className="border-2 border-black dark:border-zinc-700 p-3 bg-zinc-50 dark:bg-zinc-900/90 shadow-neo-xs flex flex-wrap items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 border border-black dark:border-white bg-white dark:bg-zinc-800">
                    {comp.name.toLowerCase().includes('sql') || comp.name.toLowerCase().includes('data') ? (
                      <Database className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    ) : comp.name.toLowerCase().includes('rabbit') || comp.name.toLowerCase().includes('broker') ? (
                      <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <Server className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black font-mono text-sm tracking-tight">{comp.name}</span>
                      {comp.database && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-yellow-200 text-black border border-black font-bold">
                          {comp.database}
                        </span>
                      )}
                    </div>
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
                    className={`px-2 py-0.5 text-xs font-mono font-black uppercase border-2 border-black dark:border-white shadow-neo-2xs ${
                      comp.status === 'HEALTHY'
                        ? 'bg-emerald-300 text-black'
                        : comp.status === 'DEGRADED'
                        ? 'bg-amber-300 text-black'
                        : 'bg-rose-400 text-black'
                    }`}
                  >
                    {comp.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Raw JSON Inspector Accordion */}
        <div className="border-2 border-black dark:border-zinc-700 bg-zinc-900 text-zinc-100 shadow-neo-sm overflow-hidden">
          <div className="flex items-center justify-between p-2.5 bg-zinc-800 border-b border-zinc-700">
            <button
              type="button"
              onClick={() => setShowRawPayload(!showRawPayload)}
              className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-200 hover:text-white cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Payload HTTP en Vivo ({showRawPayload ? 'Ocultar' : 'Ver JSON crudo'})</span>
            </button>
            <button
              type="button"
              onClick={handleCopyJson}
              aria-label="Copiar JSON"
              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono font-bold bg-zinc-700 hover:bg-zinc-600 text-white border border-zinc-500 shadow-neo-2xs transition-all active:scale-95"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copiado' : 'Copiar JSON'}
            </button>
          </div>
          {showRawPayload && (
            <pre className="p-3 text-xs font-mono overflow-x-auto text-emerald-400 bg-zinc-950 max-h-48">
              {JSON.stringify(health.rawPayload || { status: health.status }, null, 2)}
            </pre>
          )}
        </div>

        {/* Footer: API links & Refresh action */}
        <div className="pt-3 border-t-2 border-black dark:border-zinc-700 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2">
            <a
              href={`${apiUrl}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Swagger UI (/docs)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase bg-violet-200 dark:bg-violet-900 text-black dark:text-white border-2 border-black dark:border-white shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
            >
              Swagger UI (/docs)
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href={`${apiUrl}/redoc`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="ReDoc (/redoc)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase bg-sky-200 dark:bg-sky-900 text-black dark:text-white border-2 border-black dark:border-white shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase bg-yellow-300 dark:bg-yellow-400 text-black border-2 border-black shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 cursor-pointer"
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
