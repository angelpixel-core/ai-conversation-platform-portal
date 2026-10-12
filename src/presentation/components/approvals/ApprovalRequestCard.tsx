import React from 'react';
import { ToolApprovalRequest } from '@/domain/approvals/ToolApprovalRequest';

export interface ApprovalRequestCardProps {
  request: ToolApprovalRequest;
  onInspect: (request: ToolApprovalRequest) => void;
}

export const ApprovalRequestCard: React.FC<ApprovalRequestCardProps> = ({
  request,
  onInspect,
}) => {
  const getToolBadgeColor = (toolName: string) => {
    switch (toolName) {
      case 'refund_payment':
        return 'bg-amber-300 text-black';
      case 'execute_sql_query':
        return 'bg-purple-300 text-black';
      case 'export_customer_data':
        return 'bg-sky-300 text-black';
      case 'rotate_api_credentials':
        return 'bg-pink-300 text-black';
      default:
        return 'bg-gray-200 text-black';
    }
  };

  const getStatusBadge = () => {
    switch (request.status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-400 border-2 border-black font-black text-xs uppercase px-2.5 py-0.5 shadow-[2px_2px_0px_#000]">
            <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
            PENDING
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-400 border-2 border-black font-black text-xs uppercase px-2.5 py-0.5 shadow-[2px_2px_0px_#000]">
            <span>✓</span> APPROVED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-400 border-2 border-black font-black text-xs uppercase px-2.5 py-0.5 shadow-[2px_2px_0px_#000]">
            <span>✕</span> REJECTED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center bg-gray-300 border-2 border-black font-black text-xs uppercase px-2.5 py-0.5">
            {request.status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white border-3 border-black shadow-[5px_5px_0px_#000] p-5 flex flex-col justify-between transition-transform hover:-translate-y-0.5">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <span
            className={`font-mono font-black text-xs uppercase px-2.5 py-1 border-2 border-black shadow-[2px_2px_0px_#000] ${getToolBadgeColor(
              request.toolName
            )}`}
          >
            🛠️ {request.toolName}
          </span>
          {getStatusBadge()}
        </div>

        {/* Agent metadata */}
        <div className="flex items-center gap-2 text-xs font-mono text-gray-700 mb-2">
          <span className="font-bold">Agente:</span>
          <span className="bg-gray-100 px-1.5 py-0.5 border border-black font-bold">
            {request.requestedBy}
          </span>
        </div>

        {/* Reason */}
        <p className="text-sm font-medium text-black line-clamp-2 mb-3 bg-[#FFFDF8] border-2 border-black/30 p-2">
          {request.requestReason}
        </p>

        {/* Argument preview summary */}
        <div className="text-xs font-mono text-gray-500 mb-4 truncate">
          <span className="font-bold text-gray-700">Payload:</span>{' '}
          {Object.keys(request.argumentsPayload).length} parámetros (
          {Object.keys(request.argumentsPayload).slice(0, 3).join(', ')}
          {Object.keys(request.argumentsPayload).length > 3 ? '...' : ''})
        </div>

        {/* Resolution details if not pending */}
        {!request.isPending && request.resolvedBy && (
          <div className="text-xs bg-gray-100 border-2 border-black p-2 mb-4">
            <div className="font-bold text-gray-800">
              Resuelto por: <span className="font-mono">{request.resolvedBy}</span>
            </div>
            {request.decisionReason && (
              <div className="text-gray-600 truncate mt-0.5 italic">
                &ldquo;{request.decisionReason}&rdquo;
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="pt-2 border-t-2 border-black/20 flex items-center justify-between gap-2">
        <span className="text-[11px] font-mono text-gray-500">
          {request.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>

        <button
          type="button"
          onClick={() => onInspect(request)}
          className={`px-4 py-2 border-2 border-black font-black text-xs uppercase shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-colors ${
            request.isPending
              ? 'bg-yellow-300 hover:bg-yellow-200 text-black'
              : 'bg-gray-200 hover:bg-gray-300 text-black'
          }`}
        >
          {request.isPending ? '🔍 Inspeccionar Argumentos' : 'Ver Detalles'}
        </button>
      </div>
    </div>
  );
};
