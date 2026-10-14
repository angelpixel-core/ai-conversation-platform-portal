import React, { useState } from 'react';
import { WorkflowCheckpoint } from '@/domain/workflows/WorkflowCheckpoint';
import { X, Copy, Check, Terminal, Database } from 'lucide-react';

interface SnapshotInspectorModalProps {
  checkpoint: WorkflowCheckpoint | null;
  onClose: () => void;
}

export const SnapshotInspectorModal: React.FC<SnapshotInspectorModalProps> = ({
  checkpoint,
  onClose,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!checkpoint) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(checkpoint.formattedSnapshot);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      data-testid="snapshot-inspector-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl bg-[#FFFDF8] border-4 border-black shadow-neo-lg rounded-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 bg-yellow-300 border-b-4 border-black">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-black" />
            <h3 className="text-base font-black uppercase text-black tracking-tight">
              Inspección de Snapshot • {checkpoint.id} (v{checkpoint.version})
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1 bg-white hover:bg-red-400 border-2 border-black rounded shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            <X className="w-4 h-4 text-black" />
          </button>
        </div>

        {/* Modal Subheader Details */}
        <div className="flex flex-wrap items-center justify-between p-4 bg-white border-b-2 border-black text-xs font-mono gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-700">Nodo:</span>
            <span className="px-2 py-0.5 bg-black text-white rounded font-bold uppercase">
              {checkpoint.node}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-700">Fecha:</span>
            <span>{new Date(checkpoint.createdAt).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-gray-800">
            <Database className="w-3.5 h-3.5" />
            <span>{checkpoint.keyCount} Variables en Memoria</span>
          </div>
        </div>

        {/* JSON Code Viewer */}
        <div className="flex-1 p-4 overflow-y-auto bg-gray-950 text-emerald-400 font-mono text-xs">
          <pre data-testid="snapshot-json-viewer" className="whitespace-pre-wrap break-all">
            {checkpoint.formattedSnapshot}
          </pre>
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between p-4 bg-yellow-100 border-t-4 border-black">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-yellow-200 border-2 border-black rounded-lg text-xs font-black shadow-neo active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>¡Copiado al Portapapeles!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-black" />
                <span>Copiar Estado JSON</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-black hover:bg-gray-800 text-white border-2 border-black rounded-lg text-xs font-black shadow-neo active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
