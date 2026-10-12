import React, { useState } from 'react';
import { useApprovalsInbox, ApprovalFilter } from '@/application/approvals/useApprovalsInbox';
import { ApprovalsGateway } from '@/domain/approvals/ApprovalsGateway';
import { ToolApprovalRequest, ApprovalDecision } from '@/domain/approvals/ToolApprovalRequest';
import { ApprovalRequestCard } from './ApprovalRequestCard';
import { ToolArgumentsInspectorModal } from './ToolArgumentsInspectorModal';

export interface ApprovalsInboxPanelProps {
  gateway?: ApprovalsGateway;
  tenantId?: string;
}

export const ApprovalsInboxPanel: React.FC<ApprovalsInboxPanelProps> = ({
  gateway,
  tenantId,
}) => {
  const {
    filteredApprovals,
    filter,
    setFilter,
    pendingCount,
    isLoading,
    isResolving,
    error,
    refresh,
    resolveApproval,
    simulateNewRequest,
  } = useApprovalsInbox({ gateway, tenantId });

  const [selectedRequest, setSelectedRequest] = useState<ToolApprovalRequest | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleInspect = (req: ToolApprovalRequest) => {
    setSelectedRequest(req);
  };

  const handleResolveDecision = async (
    approvalId: string,
    decision: ApprovalDecision,
    reason: string,
    resolvedBy: string
  ) => {
    try {
      const resolved = await resolveApproval(approvalId, decision, reason, resolvedBy);
      setSelectedRequest(resolved);
      const actionText = decision === 'approve' ? 'aprobada con éxito' : 'rechazada correctamente';
      setSuccessToast(`Solicitud ${resolved.toolName} ${actionText}.`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch {
      // Error handled by hook
    }
  };

  const filterTabs: { label: string; value: ApprovalFilter }[] = [
    { label: 'Todas', value: 'ALL' },
    { label: `Pendientes (${pendingCount})`, value: 'PENDING' },
    { label: 'Aprobadas', value: 'APPROVED' },
    { label: 'Rechazadas', value: 'REJECTED' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Notification */}
      {successToast && (
        <div className="bg-emerald-300 border-3 border-black p-3 shadow-[4px_4px_0px_#000] flex items-center justify-between font-black text-sm text-black">
          <span>✓ {successToast}</span>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-xs font-bold border border-black px-1.5 py-0.5 bg-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#FFFDF8] border-4 border-black p-6 shadow-[6px_6px_0px_#000] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-amber-300 border-2 border-black font-black text-xs uppercase px-2 py-0.5 shadow-[2px_2px_0px_#000]">
              CU-06 • Step 8 Backend
            </span>
            <span className="bg-cyan-300 border-2 border-black font-black text-xs uppercase px-2 py-0.5 shadow-[2px_2px_0px_#000]">
              Slice 8 (Sandboxed Tool Execution & HITL)
            </span>
          </div>
          <h1 className="text-3xl font-black text-black tracking-tight flex items-center gap-3">
            <span>🛡️</span> Centro de Aprobaciones Human-in-the-Loop
          </h1>
          <p className="text-sm font-medium text-gray-700 mt-1 max-w-2xl">
            Inspección criptográfica de llamadas a herramientas sensibles de agentes IA (reembolsos,
            ejecución SQL, exportación PII). Requiere autorización explícita de un operador de seguridad.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={simulateNewRequest}
            className="border-2 border-black bg-cyan-300 hover:bg-cyan-200 text-black font-black text-xs uppercase px-3 py-2 shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            ⚡ Simular Solicitud (Agente IA)
          </button>
          <button
            type="button"
            onClick={refresh}
            className="border-2 border-black bg-gray-200 hover:bg-gray-300 text-black font-black text-xs uppercase px-3 py-2 shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            🔄 Refrescar
          </button>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex items-center gap-2 flex-wrap pb-2 border-b-2 border-black/20">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setFilter(tab.value)}
            className={`border-2 border-black px-4 py-1.5 font-black text-xs uppercase transition-all shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
              filter === tab.value
                ? 'bg-black text-yellow-300 shadow-[4px_4px_0px_#FBBF24]'
                : 'bg-white hover:bg-yellow-100 text-black'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="border-3 border-black bg-white p-12 text-center shadow-[4px_4px_0px_#000]">
          <span className="inline-block text-3xl animate-bounce mb-2">⏳</span>
          <p className="font-black text-base uppercase text-black">
            Cargando solicitudes de aprobación...
          </p>
        </div>
      ) : error ? (
        <div className="border-3 border-black bg-rose-200 p-6 shadow-[4px_4px_0px_#000]">
          <h3 className="font-black text-lg text-red-900 mb-1">Error al sincronizar aprobaciones</h3>
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      ) : filteredApprovals.length === 0 ? (
        <div className="border-3 border-dashed border-black/50 bg-[#FFFDF8] p-12 text-center shadow-[4px_4px_0px_#000]">
          <span className="text-4xl block mb-2">🎉</span>
          <h3 className="font-black text-lg text-black uppercase">
            No hay solicitudes en esta categoría
          </h3>
          <p className="text-sm font-medium text-gray-600 mt-1">
            Todas las operaciones sensibles están atendidas o no coinciden con el filtro seleccionado.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredApprovals.map((req) => (
            <ApprovalRequestCard
              key={req.id}
              request={req}
              onInspect={handleInspect}
            />
          ))}
        </div>
      )}

      {/* Inspector Modal */}
      <ToolArgumentsInspectorModal
        isOpen={Boolean(selectedRequest)}
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onResolve={handleResolveDecision}
        isResolving={isResolving}
      />
    </div>
  );
};
