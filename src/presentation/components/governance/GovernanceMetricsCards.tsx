import React from 'react';
import { ShieldAlert, Lock, Zap, FileText } from 'lucide-react';
import { GovernanceMetrics } from '@/domain/governance/GovernanceMetrics';

export interface GovernanceMetricsCardsProps {
  metrics: GovernanceMetrics | null;
}

export const GovernanceMetricsCards: React.FC<GovernanceMetricsCardsProps> = ({ metrics }) => {
  const total = metrics?.totalIncidents ?? 0;
  const blocked = metrics?.blockedJailbreaks ?? 0;
  const piiCount = metrics?.piiRedactedCount ?? 0;
  const avgRisk = metrics ? metrics.formattedAverageRisk : '0%';
  const latency = metrics ? metrics.formattedLatency : '0.0ms';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Incidents */}
      <div className="bg-white border-4 border-black p-4 shadow-neo flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-black uppercase text-zinc-600">Total Incidentes</span>
          <div className="p-2 bg-zinc-100 border-2 border-black shadow-neo-xs">
            <FileText className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-3xl font-black text-black">{total}</span>
          <p className="text-[11px] font-mono text-zinc-500 font-bold mt-1">
            Riesgo promedio: {avgRisk}
          </p>
        </div>
      </div>

      {/* Blocked Jailbreaks */}
      <div className="bg-rose-100 border-4 border-black p-4 shadow-neo flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-black uppercase text-rose-900">Jailbreaks Bloqueados</span>
          <div className="p-2 bg-rose-300 border-2 border-black shadow-neo-xs text-black">
            <ShieldAlert className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-3xl font-black text-rose-950">{blocked}</span>
          <p className="text-[11px] font-mono text-rose-800 font-bold mt-1">
            Prompt Injections interceptados
          </p>
        </div>
      </div>

      {/* PII Redacted */}
      <div className="bg-amber-100 border-4 border-black p-4 shadow-neo flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-black uppercase text-amber-900">PII Redactada</span>
          <div className="p-2 bg-amber-300 border-2 border-black shadow-neo-xs text-black">
            <Lock className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-3xl font-black text-amber-950">{piiCount}</span>
          <p className="text-[11px] font-mono text-amber-800 font-bold mt-1">
            Tarjetas & datos sensibles enmascarados
          </p>
        </div>
      </div>

      {/* Inspection Latency P99 */}
      <div className="bg-emerald-100 border-4 border-black p-4 shadow-neo flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-black uppercase text-emerald-900">Latencia Guardrails (P99)</span>
          <div className="p-2 bg-emerald-300 border-2 border-black shadow-neo-xs text-black">
            <Zap className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-3xl font-black text-emerald-950">{latency}</span>
          <p className="text-[11px] font-mono text-emerald-800 font-bold mt-1">
            Inspección en tiempo real &lt; 10ms
          </p>
        </div>
      </div>
    </div>
  );
};
