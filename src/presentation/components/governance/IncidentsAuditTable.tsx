import React from 'react';
import { Terminal, Shield, Filter, Search, ArrowUpRight } from 'lucide-react';
import { SecurityIncident } from '@/domain/governance/SecurityIncident';
import { IncidentSeverity } from '@/domain/governance/IncidentSeverity';

export interface IncidentsAuditTableProps {
  incidents: SecurityIncident[];
  selectedSeverity: IncidentSeverity | 'ALL';
  onSelectSeverity: (severity: IncidentSeverity | 'ALL') => void;
  onInspectTrace: (incident: SecurityIncident) => void;
  isLoading?: boolean;
}

const SEVERITY_OPTIONS: Array<{ label: string; value: IncidentSeverity | 'ALL' }> = [
  { label: 'TODOS', value: 'ALL' },
  { label: 'CRITICAL', value: 'CRITICAL' },
  { label: 'HIGH', value: 'HIGH' },
  { label: 'MEDIUM', value: 'MEDIUM' },
  { label: 'LOW', value: 'LOW' },
];

export const IncidentsAuditTable: React.FC<IncidentsAuditTableProps> = ({
  incidents,
  selectedSeverity,
  onSelectSeverity,
  onInspectTrace,
  isLoading = false,
}) => {
  return (
    <div className="bg-white border-4 border-black p-5 shadow-neo space-y-4">
      {/* Table Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-black pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black uppercase tracking-wider text-black">
              Registro Forense de Incidentes & Guardrails
            </h3>
            <span className="font-mono text-xs font-black px-2 py-0.5 bg-black text-amber-300 border border-black">
              {incidents.length} EVENTOS
            </span>
          </div>
          <p className="text-xs font-mono text-zinc-600 font-bold mt-0.5">
            Trazabilidad distribuida W3C correlacionada y ofuscación de datos personales
          </p>
        </div>

        {/* Severity Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-mono font-bold text-zinc-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filtro:
          </span>
          {SEVERITY_OPTIONS.map((opt) => {
            const isActive = selectedSeverity === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onSelectSeverity(opt.value)}
                className={`px-3 py-1 font-mono text-xs font-black uppercase border-2 border-black transition-all cursor-pointer ${
                  isActive
                    ? 'bg-black text-amber-300 shadow-neo-xs -translate-y-0.5'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-black bg-zinc-100 font-mono text-xs font-black uppercase text-black">
              <th className="py-2.5 px-3">Severidad</th>
              <th className="py-2.5 px-3">Violación</th>
              <th className="py-2.5 px-3">Patrón / Snippet Sanitizado</th>
              <th className="py-2.5 px-3">Riesgo</th>
              <th className="py-2.5 px-3">Traza OpenTelemetry</th>
              <th className="py-2.5 px-3">Hora</th>
              <th className="py-2.5 px-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-black/10 font-mono text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500 font-bold">
                  Cargando incidentes forenses...
                </td>
              </tr>
            ) : incidents.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500 font-bold">
                  No se encontraron incidentes para el filtro seleccionado.
                </td>
              </tr>
            ) : (
              incidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 text-[11px] font-black uppercase border border-black ${inc.severityBadgeClass}`}>
                      {inc.severity}
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap font-bold text-black">
                    {inc.violationType}
                  </td>
                  <td className="py-3 px-3 max-w-xs sm:max-w-md truncate" title={inc.redactedSnippet}>
                    <div className="space-y-0.5">
                      <span className="font-bold text-zinc-900 block truncate">{inc.detectedPattern}</span>
                      <span className="text-[11px] text-zinc-600 block truncate font-sans">{inc.redactedSnippet}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap font-bold">
                    <span className={inc.isCritical ? 'text-red-600 font-black' : 'text-zinc-800'}>
                      {inc.formattedRisk}
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onInspectTrace(inc)}
                      className="font-mono text-xs underline font-bold hover:text-blue-600 cursor-pointer flex items-center gap-1"
                      title={inc.traceId}
                    >
                      {inc.traceId.slice(0, 8)}...{inc.traceId.slice(-4)}
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-zinc-600">
                    {inc.createdAt.toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-right">
                    <button
                      type="button"
                      onClick={() => onInspectTrace(inc)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-200 text-black border border-black font-black uppercase text-[11px] hover:bg-amber-300 shadow-neo-xs hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
                    >
                      <Terminal className="w-3 h-3 stroke-[2.5]" />
                      Traza
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
