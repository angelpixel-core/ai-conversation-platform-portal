import React, { useState } from 'react';
import { ShieldAlert, Copy, Check, X } from 'lucide-react';
import { SecurityIncident } from '@/domain/governance/SecurityIncident';

export interface IncidentAlertBannerProps {
  incident: SecurityIncident;
  onDismiss: () => void;
}

export const IncidentAlertBanner: React.FC<IncidentAlertBannerProps> = ({
  incident,
  onDismiss,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyTrace = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(incident.traceId);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard write failure
    }
  };

  return (
    <div
      role="alert"
      className="p-4 bg-red-500 text-white border-4 border-black shadow-neo-lg relative overflow-hidden transition-all"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-black text-amber-300 border-2 border-white shadow-neo-xs shrink-0 mt-0.5">
            <ShieldAlert className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-black px-2 py-0.5 bg-black text-white border border-white uppercase">
                {incident.severity}
              </span>
              <h4 className="font-black text-base uppercase tracking-wider text-white">
                Ataque Interceptado por Guardrails: {incident.violationType}
              </h4>
            </div>

            <p className="text-xs sm:text-sm text-red-50 font-medium">
              Riesgo adversarial: <span className="font-bold underline">{incident.formattedRisk}</span> | Patrón detectado: <code className="font-mono bg-black/40 px-1 py-0.5 text-amber-200">{incident.detectedPattern}</code>
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-mono text-red-100">
                X-Trace-ID: <span className="font-bold underline">{incident.traceId}</span>
              </span>
              <button
                type="button"
                onClick={handleCopyTrace}
                aria-label="Copiar ID de traza"
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-black text-white hover:bg-zinc-800 text-[11px] font-mono font-bold border border-white transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copiar Traza</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar alerta de guardrail"
          className="self-start sm:self-center px-3 py-1.5 bg-white text-black font-black uppercase text-xs border-2 border-black shadow-neo-xs hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer flex items-center gap-1 shrink-0"
        >
          <X className="w-4 h-4 stroke-[3]" />
          Cerrar
        </button>
      </div>
    </div>
  );
};
