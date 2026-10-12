import React, { useState } from 'react';
import { Citation } from '@/domain/knowledge/Citation';

export interface CitationDrawerProps {
  isOpen: boolean;
  citation: Citation | null;
  onClose: () => void;
}

export const CitationDrawer: React.FC<CitationDrawerProps> = ({
  isOpen,
  citation,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !citation) return null;

  const handleCopy = () => {
    navigator.clipboard?.writeText(citation.snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs animate-fade-in"
    >
      <div className="w-full max-w-md h-full bg-[#FFFDF8] border-l-4 border-black shadow-[-8px_0px_0px_#000] p-6 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between border-b-3 border-black pb-3">
            <div>
              <span className="bg-yellow-300 border-2 border-black font-black text-xs uppercase px-2 py-0.5 shadow-[2px_2px_0px_#000]">
                RAG Citation Grounding
              </span>
              <h3 id="drawer-title" className="text-xl font-black text-black mt-1">
                Fuente Documental
              </h3>
            </div>
            <button
              onClick={onClose}
              className="border-2 border-black bg-rose-400 hover:bg-rose-300 text-black font-black w-8 h-8 flex items-center justify-center shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              aria-label="Cerrar panel"
            >
              ✕
            </button>
          </div>

          {/* Document and Score Info */}
          <div className="bg-white border-2 border-black p-3 space-y-2 shadow-[2px_2px_0px_#000]">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-gray-500 uppercase">Documento</span>
              <span className="font-mono text-xs font-black bg-black text-white px-2 py-0.5">
                {citation.chunkId}
              </span>
            </div>
            <p className="font-mono font-bold text-sm text-black truncate">
              📄 {citation.documentName}
            </p>

            <div className="pt-2 border-t border-black/20 flex items-center justify-between">
              <span className="font-bold text-xs text-gray-500 uppercase">Similitud Vectorial</span>
              <span
                className={`font-mono text-xs font-black border border-black px-2 py-0.5 ${
                  citation.isHighRelevance
                    ? 'bg-emerald-400 text-black'
                    : 'bg-amber-300 text-black'
                }`}
              >
                ✓ {citation.formattedScore}
              </span>
            </div>
          </div>

          {/* Original Snippet Text */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-black text-xs uppercase text-black">
                Fragmento Textual Original (Chunk):
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs font-bold bg-white border border-black px-2 py-0.5 shadow-[2px_2px_0px_#000] hover:bg-yellow-200"
              >
                {copied ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
            <div className="bg-[#0F172A] text-emerald-400 font-mono text-xs p-4 border-2 border-black shadow-[3px_3px_0px_#000] leading-relaxed max-h-64 overflow-y-auto">
              &ldquo;{citation.snippet}&rdquo;
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-black pt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 border-2 border-black bg-gray-200 hover:bg-gray-300 font-black text-xs uppercase shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            Cerrar Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
