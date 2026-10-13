import React, { useState } from 'react';
import { useWorkflowOrchestrator } from '@/application/workflows/useWorkflowOrchestrator';
import { WorkflowGraphViewer } from './WorkflowGraphViewer';
import { CheckpointsTimeline } from './CheckpointsTimeline';
import { SnapshotInspectorModal } from './SnapshotInspectorModal';
import { WorkflowResumeControls } from './WorkflowResumeControls';
import { Play, RotateCcw, StepForward, Activity, ShieldAlert, Sparkles, Building2, CheckCircle2 } from 'lucide-react';

interface WorkflowsDashboardPanelProps {
  tenantId?: string;
}

export const WorkflowsDashboardPanel: React.FC<WorkflowsDashboardPanelProps> = ({ tenantId }) => {
  const {
    workflow,
    checkpoints,
    selectedCheckpoint,
    isLoading,
    isExecuting,
    isResuming,
    startNewWorkflow,
    advanceStep,
    resumeWorkflow,
    inspectCheckpoint,
    resetWorkflow,
  } = useWorkflowOrchestrator({ tenantId });

  const [promptInput, setPromptInput] = useState<string>(
    'Auditar directivas de seguridad corporativas y resumir factores de riesgo.'
  );

  const canAdvance =
    workflow?.status === 'RUNNING' &&
    (workflow.activeNodeId === 'supervisor' || workflow.activeNodeId === 'researcher');

  const isPaused = workflow?.status === 'PAUSED_FOR_APPROVAL';
  const isCompleted = workflow?.status === 'COMPLETED';

  return (
    <div
      data-testid="workflows-dashboard-panel"
      className="space-y-6"
    >
      {/* Header Banner */}
      <div className="p-6 bg-yellow-300 border-4 border-black shadow-neo rounded-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white text-xs font-mono font-bold rounded mb-2">
              <Building2 className="w-3.5 h-3.5 text-yellow-300" />
              <span>CU-09: ORQUESTACIÓN MULTI-AGENTE & CHECKPOINTS</span>
            </div>
            <h2 className="text-2xl font-black text-black tracking-tight">
              Grafo Visual de Estado y Reanudación de Flujos
            </h2>
            <p className="mt-1 text-xs font-medium text-gray-800 max-w-2xl">
              Supervisión de agentes coordinados (LangGraph / State Graphs), traspasos de control (*agent handoff*), persistencia inmutable de snapshots y reanudación con autorización humana (*HITL*).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => startNewWorkflow(promptInput)}
              disabled={isExecuting}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-yellow-100 border-2 border-black rounded-lg text-xs font-black uppercase text-black shadow-neo active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              {isExecuting ? 'Iniciando...' : 'Iniciar Nuevo Grafo'}
            </button>

            {canAdvance && (
              <button
                type="button"
                onClick={advanceStep}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-yellow-400 hover:bg-yellow-500 border-2 border-black rounded-lg text-xs font-black uppercase text-black shadow-neo active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
              >
                <StepForward className="w-3.5 h-3.5" />
                Avanzar Paso
              </button>
            )}

            <button
              type="button"
              onClick={resetWorkflow}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-black hover:bg-gray-800 text-white border-2 border-black rounded-lg text-xs font-black uppercase shadow-neo active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reiniciar Demo
            </button>
          </div>
        </div>
      </div>

      {/* Telemetry Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border-4 border-black shadow-neo rounded-xl">
          <div className="text-[11px] font-mono font-bold uppercase text-gray-600 mb-1">
            Agente Activo
          </div>
          <div className="text-lg font-black text-black uppercase tracking-tight flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-purple-600" />
            {workflow?.activeNodeId || (isCompleted ? 'Finalizado' : 'Ninguno')}
          </div>
        </div>

        <div className="p-4 bg-white border-4 border-black shadow-neo rounded-xl">
          <div className="text-[11px] font-mono font-bold uppercase text-gray-600 mb-1">
            Checkpoints Persistidos
          </div>
          <div className="text-lg font-black text-black tracking-tight font-mono">
            {checkpoints.length} Versiones
          </div>
        </div>

        <div className="p-4 bg-white border-4 border-black shadow-neo rounded-xl">
          <div className="text-[11px] font-mono font-bold uppercase text-gray-600 mb-1">
            Estado de Ejecución
          </div>
          <div className="text-sm font-black tracking-tight">
            {isPaused ? (
              <span className="inline-flex items-center gap-1 text-amber-800">
                <ShieldAlert className="w-4 h-4 text-amber-600" /> PAUSADO (HITL)
              </span>
            ) : isCompleted ? (
              <span className="inline-flex items-center gap-1 text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> COMPLETADO
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-blue-800">
                <Sparkles className="w-4 h-4 text-blue-600" /> {workflow?.status || 'IDLE'}
              </span>
            )}
          </div>
        </div>

        <div className="p-4 bg-white border-4 border-black shadow-neo rounded-xl">
          <div className="text-[11px] font-mono font-bold uppercase text-gray-600 mb-1">
            ID de Workflow
          </div>
          <div className="text-xs font-mono font-bold text-gray-800 truncate">
            {workflow?.id.value || 'N/A'}
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      {workflow && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Graph Viewer and Controls (7 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <WorkflowGraphViewer workflow={workflow} />

            {isPaused && (
              <WorkflowResumeControls
                isResuming={isResuming}
                onResume={(overrideText) => resumeWorkflow(overrideText)}
              />
            )}

            {isCompleted && (
              <div className="p-5 bg-emerald-100 border-4 border-black shadow-neo rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-800" />
                  <div>
                    <h4 className="text-sm font-black uppercase text-emerald-950">
                      Flujo Multi-Agente Completado Exitosamente
                    </h4>
                    <p className="text-xs font-medium text-emerald-900">
                      El Sintetizador Ejecutivo integró todos los hallazgos validados con la autorización del operador.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Checkpoints Timeline (4 cols) */}
          <div className="lg:col-span-4">
            <CheckpointsTimeline
              checkpoints={checkpoints}
              onInspect={(chk) => inspectCheckpoint(chk)}
            />
          </div>
        </div>
      )}

      {/* Time-Travel Snapshot Inspector Modal */}
      <SnapshotInspectorModal
        checkpoint={selectedCheckpoint}
        onClose={() => inspectCheckpoint(null)}
      />
    </div>
  );
};
