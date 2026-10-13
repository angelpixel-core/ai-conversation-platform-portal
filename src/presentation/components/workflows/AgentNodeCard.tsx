import React from 'react';
import { WorkflowNode } from '@/domain/workflows/WorkflowNode';
import { Bot, CheckCircle, AlertTriangle, Play, Clock } from 'lucide-react';

interface AgentNodeCardProps {
  node: WorkflowNode;
  isActive?: boolean;
}

export const AgentNodeCard: React.FC<AgentNodeCardProps> = ({ node, isActive = false }) => {
  const isRunning = node.isRunning || isActive;

  const renderStatusBadge = () => {
    switch (node.status) {
      case 'RUNNING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-black bg-yellow-300 text-black border-2 border-black rounded shadow-[2px_2px_0px_#000] animate-pulse">
            <Play className="w-3 h-3 fill-black" /> EN EJECUCIÓN
          </span>
        );
      case 'PAUSED_FOR_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-black bg-amber-400 text-black border-2 border-black rounded shadow-[2px_2px_0px_#000]">
            <AlertTriangle className="w-3 h-3" /> PAUSADO (HITL)
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-black bg-emerald-300 text-black border-2 border-black rounded shadow-[2px_2px_0px_#000]">
            <CheckCircle className="w-3 h-3" /> COMPLETADO
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-black bg-red-400 text-black border-2 border-black rounded shadow-[2px_2px_0px_#000]">
            FALLIDO
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-gray-200 text-gray-700 border-2 border-black rounded">
            <Clock className="w-3 h-3" /> EN ESPERA
          </span>
        );
    }
  };

  return (
    <div
      data-testid={`agent-node-${node.id}`}
      style={{ borderLeftColor: node.accentColor }}
      className={`relative p-4 bg-white border-4 border-black shadow-neo border-l-[10px] rounded-lg transition-all ${
        isRunning
          ? 'ring-4 ring-yellow-400 ring-offset-2 scale-[1.02] shadow-[6px_6px_0px_#000]'
          : node.isPaused
          ? 'ring-4 ring-amber-400 ring-offset-2'
          : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Bot className="w-4 h-4" style={{ color: node.accentColor }} />
          <span className="text-[11px] font-black uppercase tracking-wider text-gray-800">
            {node.role}
          </span>
        </div>
        {renderStatusBadge()}
      </div>

      <h4 className="text-base font-black text-black tracking-tight">{node.name}</h4>
      <p className="mt-1 text-xs font-medium text-gray-600 line-clamp-2">{node.description}</p>

      {node.outputSummary && (
        <div className="mt-3 p-2 bg-yellow-50 border-2 border-black rounded text-[11px] font-mono text-gray-900">
          <span className="font-bold">Salida:</span> {node.outputSummary}
        </div>
      )}
    </div>
  );
};
