import React, { useState } from 'react';
import { ToolApprovalRequest, ApprovalDecision } from '@/domain/approvals/ToolApprovalRequest';

export interface ToolArgumentsInspectorModalProps {
  isOpen: boolean;
  request: ToolApprovalRequest | null;
  onClose: () => void;
  onResolve: (
    approvalId: string,
    decision: ApprovalDecision,
    reason: string,
    resolvedBy: string
  ) => void;
  isResolving: boolean;
}

export const ToolArgumentsInspectorModal: React.FC<ToolArgumentsInspectorModalProps> = ({
  isOpen,
  request,
  onClose,
  onResolve,
  isResolving,
}) => {
  const [reason, setReason] = useState<string>('');
  const [operatorId, setOperatorId] = useState<string>('sec-officer@corp.com');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen || !request) return null;

  const handleCopyJson = () => {
    navigator.clipboard?.writeText(request.formattedArguments);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (decision: ApprovalDecision) => {
    if (!reason.trim()) {
      setValidationError('La justificación de auditoría es obligatoria (mínimo 5 caracteres).');
      return;
    }
    if (reason.trim().length < 5) {
      setValidationError('La justificación debe tener al menos 5 caracteres descriptivos.');
      return;
    }

    setValidationError(null);
    onResolve(request.id, decision, reason.trim(), operatorId.trim() || 'operator@corp.com');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-2xl bg-[#FFFDF8] border-4 border-black shadow-[8px_8px_0px_#000] p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b-3 border-black pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-amber-300 border-2 border-black font-black text-xs uppercase px-2 py-0.5 shadow-[2px_2px_0px_#000]">
                {request.status}
              </span>
              <span className="font-mono text-xs font-bold text-gray-600">
                ID: {request.id}
              </span>
            </div>
            <h2 id="modal-title" className="text-2xl font-black tracking-tight text-black flex items-center gap-2">
              <span>🛠️</span> {request.toolName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="border-2 border-black bg-rose-400 hover:bg-rose-300 text-black font-black w-8 h-8 flex items-center justify-center shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Metadata Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 bg-gray-100 border-2 border-black p-3 text-sm">
          <div>
            <span className="block font-bold text-gray-500 text-xs uppercase">Agente Solicitante</span>
            <span className="font-mono font-bold text-black">{request.requestedBy}</span>
          </div>
          <div>
            <span className="block font-bold text-gray-500 text-xs uppercase">Fecha / Timestamp</span>
            <span className="font-mono text-black text-xs">
              {request.createdAt.toLocaleString()}
            </span>
          </div>
          <div className="sm:col-span-2">
            <span className="block font-bold text-gray-500 text-xs uppercase">Motivo Declarado por Agente</span>
            <p className="font-medium text-black mt-0.5">{request.requestReason}</p>
          </div>
        </div>

        {/* JSON Arguments Viewer */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="font-black text-xs uppercase text-black tracking-wider flex items-center gap-1">
              <span>📋</span> Argumentos de Invocación (JSON Payload)
            </span>
            <button
              type="button"
              onClick={handleCopyJson}
              className="text-xs font-bold bg-white border-2 border-black px-2 py-0.5 shadow-[2px_2px_0px_#000] hover:bg-yellow-200 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              {copied ? '✓ Copiado' : 'Copiar JSON'}
            </button>
          </div>
          <pre className="bg-[#0F172A] text-emerald-400 font-mono text-xs p-4 border-3 border-black shadow-[4px_4px_0px_#000] overflow-x-auto max-h-56 leading-relaxed">
            <code>{request.formattedArguments}</code>
          </pre>
        </div>

        {/* Resolution section (if pending) */}
        {request.isPending ? (
          <div className="space-y-4 border-t-3 border-black pt-4">
            <div>
              <label htmlFor="operator-id" className="block font-black text-xs uppercase text-black mb-1">
                Operador de Seguridad Responsable
              </label>
              <input
                id="operator-id"
                type="text"
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
                className="w-full border-2 border-black p-2 font-mono text-sm bg-white shadow-[2px_2px_0px_#000] focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="sec-officer@corp.com"
              />
            </div>

            <div>
              <label htmlFor="audit-reason" className="block font-black text-xs uppercase text-black mb-1">
                Justificación de Auditoría Obligatoria <span className="text-red-600">*</span>
              </label>
              <textarea
                id="audit-reason"
                rows={3}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                className={`w-full border-2 border-black p-2 text-sm bg-white shadow-[2px_2px_0px_#000] focus:outline-none focus:ring-2 focus:ring-black ${
                  validationError ? 'border-red-600 bg-red-50' : ''
                }`}
                placeholder="Ingrese la justificación de auditoría para aprobar o denegar la ejecución..."
              />
              {validationError && (
                <p className="text-red-600 text-xs font-bold mt-1 animate-shake">
                  ⚠️ {validationError}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isResolving}
                className="w-full sm:w-auto px-4 py-2 border-2 border-black bg-gray-200 hover:bg-gray-300 font-black text-xs uppercase shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSubmit('reject')}
                disabled={isResolving}
                className="w-full sm:w-auto px-5 py-2.5 border-3 border-black bg-rose-400 hover:bg-rose-300 text-black font-black text-sm uppercase shadow-[4px_4px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50"
              >
                {isResolving ? 'Procesando...' : '🔴 Rechazar Ejecución'}
              </button>
              <button
                type="button"
                onClick={() => handleSubmit('approve')}
                disabled={isResolving}
                className="w-full sm:w-auto px-5 py-2.5 border-3 border-black bg-emerald-400 hover:bg-emerald-300 text-black font-black text-sm uppercase shadow-[4px_4px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50"
              >
                {isResolving ? 'Procesando...' : '🟢 Aprobar Ejecución'}
              </button>
            </div>
          </div>
        ) : (
          /* Already resolved banner */
          <div className="border-3 border-black bg-gray-100 p-4 mt-4 shadow-[4px_4px_0px_#000]">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`font-black text-xs uppercase px-2 py-0.5 border-2 border-black ${
                  request.status === 'APPROVED' ? 'bg-emerald-300' : 'bg-rose-300'
                }`}
              >
                {request.status}
              </span>
              <span className="font-mono text-xs text-gray-700">
                Resuelto por: <strong>{request.resolvedBy}</strong>
              </span>
            </div>
            <p className="text-sm font-medium text-black">
              <strong>Motivo de Auditoría:</strong> {request.decisionReason || 'Sin motivo adicional'}
            </p>
            {request.resolvedAt && (
              <span className="block text-xs font-mono text-gray-500 mt-1">
                Fecha resolución: {request.resolvedAt.toLocaleString()}
              </span>
            )}
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border-2 border-black bg-gray-300 hover:bg-gray-200 font-black text-xs uppercase shadow-[2px_2px_0px_#000]"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
