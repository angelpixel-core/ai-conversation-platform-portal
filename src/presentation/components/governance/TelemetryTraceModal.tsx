import React, { useState } from 'react';
import { X, Copy, Check, Terminal, ExternalLink, ShieldAlert } from 'lucide-react';
import { SecurityIncident } from '@/domain/governance/SecurityIncident';

export interface TelemetryTraceModalProps {
  incident: SecurityIncident | null;
  onClose: () => void;
}

export const TelemetryTraceModal: React.FC<TelemetryTraceModalProps> = ({
  incident,
  onClose,
}) => {
  const [copiedTrace, setCopiedTrace] = useState(false);
  const [copiedW3c, setCopiedW3c] = useState(false);

  if (!incident) return null;

  const w3cTraceparent = `00-${incident.traceId}-${incident.spanId}-01`;

  const copyTrace = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(incident.traceId);
      }
      setCopiedTrace(true);
      setTimeout(() => setCopiedTrace(false), 2000);
    } catch {
      // Ignore
    }
  };

  const copyW3c = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(w3cTraceparent);
      }
      setCopiedW3c(true);
      setTimeout(() => setCopiedW3c(false), 2000);
    } catch {
      // Ignore
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="trace-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div className="bg-white border-4 border-black shadow-neo-xl max-w-2xl w-full p-6 space-y-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b-4 border-black pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-black text-amber-300 border-2 border-black shadow-neo-xs">
              <Terminal className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-mono text-xs font-black uppercase text-zinc-500">
                OpenTelemetry W3C TraceContext
              </span>
              <h3 id="trace-modal-title" className="text-xl font-black uppercase tracking-tight text-black">
                Inspector Forense de Traza
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de traza"
            className="p-1.5 bg-white text-black border-2 border-black shadow-neo-xs hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-zinc-50 border-2 border-black">
              <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Incidente ID</span>
              <p className="font-mono font-black text-sm text-black">{incident.id}</p>
            </div>
            <div className="p-3 bg-zinc-50 border-2 border-black">
              <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Tenant</span>
              <p className="font-mono font-black text-sm text-black">{incident.tenantId}</p>
            </div>
            <div className="p-3 bg-zinc-50 border-2 border-black">
              <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Severidad / Riesgo</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`px-2 py-0.5 font-mono text-xs font-black uppercase border border-black ${incident.severityBadgeClass}`}>
                  {incident.severity}
                </span>
                <span className="font-mono font-bold text-xs text-black">
                  Score: {incident.formattedRisk}
                </span>
              </div>
            </div>
            <div className="p-3 bg-zinc-50 border-2 border-black">
              <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Tipo de Violación</span>
              <p className="font-mono font-black text-sm text-rose-600">{incident.violationType}</p>
            </div>
          </div>

          {/* Trace Context Block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-black uppercase text-black">
                Cabeceras de Telemetría Distribuida
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyTrace}
                  className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-black border border-black font-mono text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                >
                  {copiedTrace ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copiedTrace ? '¡Copiado!' : 'Trace-ID'}
                </button>
                <button
                  type="button"
                  onClick={copyW3c}
                  className="px-2 py-1 bg-amber-200 hover:bg-amber-300 text-black border border-black font-mono text-xs font-black transition-all cursor-pointer inline-flex items-center gap-1"
                >
                  {copiedW3c ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copiedW3c ? '¡Copiado!' : 'traceparent'}
                </button>
              </div>
            </div>

            <div className="bg-black text-emerald-400 p-3 font-mono text-xs space-y-1.5 border-2 border-black shadow-neo-sm overflow-x-auto">
              <p className="text-zinc-400">// W3C TraceContext Specification</p>
              <p><span className="text-amber-300">X-Trace-ID:</span> {incident.traceId}</p>
              <p><span className="text-amber-300">X-Span-ID:</span>  {incident.spanId}</p>
              <p><span className="text-amber-300">traceparent:</span> {w3cTraceparent}</p>
            </div>
          </div>

          {/* Pattern & Redacted Snippet */}
          <div className="space-y-2">
            <span className="font-mono text-xs font-black uppercase text-black">
              Evidencia Auditada & Redacción de PII
            </span>
            <div className="p-3 bg-red-50 border-2 border-black space-y-1.5">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <span className="font-mono text-xs font-bold text-red-900">
                  Patrón Interceptado: <code className="bg-white px-1 border border-black text-black">{incident.detectedPattern}</code>
                </span>
              </div>
              <p className="text-xs font-mono text-zinc-800 bg-white p-2 border border-black whitespace-pre-wrap">
                {incident.redactedSnippet}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-4 border-black pt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-[11px] text-zinc-500 font-bold">
            Registrado: {incident.createdAt.toLocaleString()}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-black text-white hover:bg-zinc-800 font-mono text-xs font-black uppercase border-2 border-black shadow-neo-xs hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
          >
            Entendido / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
