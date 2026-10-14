import React from 'react';
import { WorkflowAggregate } from '@/domain/workflows/WorkflowAggregate';
import { AgentNodeCard } from './AgentNodeCard';
import { ArrowRight, GitFork, Activity } from 'lucide-react';

interface WorkflowGraphViewerProps {
  workflow: WorkflowAggregate;
}

export const WorkflowGraphViewer: React.FC<WorkflowGraphViewerProps> = ({ workflow }) => {
  const nodes = workflow.nodes;

  return (
    <div
      data-testid="workflow-graph-viewer"
      className="p-6 bg-[#FFFDF8] border-4 border-black shadow-neo rounded-xl"
    >
      <div className="flex flex-wrap items-center justify-between pb-4 mb-6 border-b-4 border-black gap-2">
        <div className="flex items-center gap-2">
          <GitFork className="w-5 h-5 text-black" />
          <h3 className="text-lg font-black uppercase tracking-tight text-black">
            Lienzo de Grafo Multi-Agente (LangGraph / State Graph)
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 bg-yellow-300 border-2 border-black rounded text-xs font-black shadow-[2px_2px_0px_#000]">
            <Activity className="w-3.5 h-3.5" />
            {workflow.activeNodeId ? `ACTIVO: ${workflow.activeNodeId.toUpperCase()}` : `ESTADO: ${workflow.status}`}
          </span>
          <span className="px-2 py-1 bg-white border-2 border-black rounded text-xs font-mono font-bold">
            {workflow.graphName}
          </span>
        </div>
      </div>

      {/* Grid of 4 interconnected agents with tactile arrow transitions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
        {nodes.map((node, index) => {
          const isCurrentActive = workflow.activeNodeId === node.id;
          const isNotLast = index < nodes.length - 1;

          return (
            <React.Fragment key={node.id}>
              <div className="relative">
                <AgentNodeCard node={node} isActive={isCurrentActive} />
                {isNotLast && (
                  <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-black text-yellow-300 rounded-full items-center justify-center border-2 border-white shadow-[2px_2px_0px_#000]">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Flow Architecture Legend */}
      <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-400 flex flex-wrap items-center justify-between text-xs font-mono text-gray-700">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-[#8B5CF6] border border-black rounded-sm" /> 1. Supervisor
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-[#3B82F6] border border-black rounded-sm" /> 2. Researcher
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-[#FBBF24] border border-black rounded-sm" /> 3. Auditor (HITL)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-[#10B981] border border-black rounded-sm" /> 4. Synthesizer
          </span>
        </div>
        <div className="font-bold">
          Topología Dirigida • Tolerante a Fallas y Pausas
        </div>
      </div>
    </div>
  );
};
