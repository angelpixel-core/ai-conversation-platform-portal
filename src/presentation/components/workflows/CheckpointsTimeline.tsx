import React from 'react';
import { WorkflowCheckpoint } from '@/domain/workflows/WorkflowCheckpoint';
import { History, Eye, ShieldCheck, Database } from 'lucide-react';

interface CheckpointsTimelineProps {
  checkpoints: WorkflowCheckpoint[];
  onInspect: (checkpoint: WorkflowCheckpoint) => void;
}

export const CheckpointsTimeline: React.FC<CheckpointsTimelineProps> = ({
  checkpoints,
  onInspect,
}) => {
  return (
    <div
      data-testid="checkpoints-timeline"
      className="p-5 bg-white border-4 border-black shadow-neo rounded-xl"
    >
      <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-black">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-black" />
          <h3 className="text-base font-black uppercase tracking-tight text-black">
            Línea de Tiempo de Checkpoints
          </h3>
        </div>
        <span className="px-2 py-0.5 bg-black text-white text-xs font-mono font-bold rounded">
          {checkpoints.length} {checkpoints.length === 1 ? 'Versión' : 'Versiones'}
        </span>
      </div>

      {checkpoints.length === 0 ? (
        <div className="p-6 text-center text-sm font-mono text-gray-500 border-2 border-dashed border-gray-300 rounded">
          No hay checkpoints persistidos todavía.
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-1 before:bg-black">
          {checkpoints.map((chk) => (
            <div
              key={chk.id}
              data-testid={`checkpoint-item-${chk.id}`}
              className="relative p-3 bg-yellow-50 border-2 border-black rounded-lg shadow-neo-sm hover:translate-x-1 transition-all"
            >
              {/* Bullet indicator on the vertical timeline wire */}
              <div className="absolute -left-[27px] top-4 w-4 h-4 bg-yellow-400 border-2 border-black rounded-full shadow-[1px_1px_0px_#000]" />

              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs font-black bg-black text-yellow-300 rounded font-mono">
                    v{chk.version}
                  </span>
                  <span className="text-xs font-bold uppercase text-gray-900 tracking-wide">
                    Nodo: <span className="underline decoration-yellow-500 decoration-2">{chk.node}</span>
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-mono text-gray-600">
                  <Database className="w-3 h-3" />
                  <span>{chk.keyCount} claves</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-300 text-xs font-mono">
                <span className="text-[11px] text-gray-600">
                  {new Date(chk.createdAt).toLocaleTimeString()}
                </span>
                <button
                  type="button"
                  onClick={() => onInspect(chk)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-yellow-200 border-2 border-black rounded text-[11px] font-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                >
                  <Eye className="w-3 h-3" />
                  Inspeccionar Snapshot
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-3 border-t-2 border-black flex items-center gap-2 text-[11px] font-mono text-gray-600">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Persistencia Inmutable con Time-Travel Inspection</span>
      </div>
    </div>
  );
};
