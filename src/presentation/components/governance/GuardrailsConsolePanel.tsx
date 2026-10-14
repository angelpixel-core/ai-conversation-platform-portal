import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  RefreshCw,
  Terminal,
  AlertTriangle,
  Lock,
  Flame,
} from 'lucide-react';
import { useSecurityGuardrails } from '@/application/governance/useSecurityGuardrails';
import { IncidentAlertBanner } from './IncidentAlertBanner';
import { GovernanceMetricsCards } from './GovernanceMetricsCards';
import { IncidentsAuditTable } from './IncidentsAuditTable';
import { TelemetryTraceModal } from './TelemetryTraceModal';

export const GuardrailsConsolePanel: React.FC = () => {
  const {
    incidents,
    metrics,
    severityFilter,
    setSeverityFilter,
    selectedTraceIncident,
    selectTrace,
    activeAlert,
    dismissAlert,
    isLoading,
    isSimulating,
    error,
    refreshData,
    simulateAttack,
  } = useSecurityGuardrails();

  return (
    <div className="space-y-6">
      {/* Header & Status Section */}
      <div className="bg-white border-4 border-black p-6 shadow-neo-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-black px-2.5 py-0.5 bg-black text-amber-300 border border-black uppercase tracking-wider">
                OpenTelemetry W3C • Distributed Tracing
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-xs font-black px-2.5 py-0.5 bg-emerald-300 text-black border border-black uppercase">
                <ShieldCheck className="w-3.5 h-3.5" />
                Zero-Leak Policy Activa
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
              Centro de Observabilidad & Guardrails de Seguridad
            </h2>
            <p className="text-xs sm:text-sm text-zinc-700 font-medium leading-relaxed">
              Supervisión en tiempo real de intercepción de ataques adversarios (Prompt Injection),
              redacción automática de PII conforme a normativas GDPR/PCI-DSS y telemetría correlacionada.
            </p>
          </div>

          <button
            type="button"
            onClick={() => refreshData()}
            disabled={isLoading}
            className="self-start md:self-center px-4 py-2.5 bg-yellow-300 text-black border-2 border-black font-black uppercase text-xs shadow-neo hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer inline-flex items-center gap-2 disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar Métricas
          </button>
        </div>

        {/* Live Attack Simulator Toolbar */}
        <div className="mt-6 pt-4 border-t-2 border-black/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-black uppercase text-black flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              Simulador de Ataques Adversarios:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => simulateAttack('PROMPT_INJECTION')}
              disabled={isSimulating}
              className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-mono text-xs font-black uppercase border-2 border-black shadow-neo-xs hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Flame className="w-3.5 h-3.5" />
              Simular Prompt Injection
            </button>
            <button
              type="button"
              onClick={() => simulateAttack('PII_LEAK')}
              disabled={isSimulating}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-black font-mono text-xs font-black uppercase border-2 border-black shadow-neo-xs hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              Simular Fuga de Tarjeta
            </button>
            <button
              type="button"
              onClick={() => simulateAttack('HARMFUL_CONTENT')}
              disabled={isSimulating}
              className="px-3 py-1.5 bg-zinc-200 hover:bg-zinc-300 text-black font-mono text-xs font-black uppercase border-2 border-black shadow-neo-xs hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Simular Contenido Tóxico
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-100 border-4 border-black text-black font-mono text-xs font-bold shadow-neo">
          ⚠️ {error}
        </div>
      )}

      {/* Active Incident Alert Banner */}
      {activeAlert && (
        <IncidentAlertBanner incident={activeAlert} onDismiss={dismissAlert} />
      )}

      {/* 4 KPI Metrics Cards */}
      <GovernanceMetricsCards metrics={metrics} />

      {/* Forensic Incidents Audit Table */}
      <IncidentsAuditTable
        incidents={incidents}
        selectedSeverity={severityFilter}
        onSelectSeverity={setSeverityFilter}
        onInspectTrace={selectTrace}
        isLoading={isLoading}
      />

      {/* OpenTelemetry Trace Modal */}
      {selectedTraceIncident && (
        <TelemetryTraceModal
          incident={selectedTraceIncident}
          onClose={() => selectTrace(null)}
        />
      )}
    </div>
  );
};
