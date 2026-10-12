import React from 'react';
import { KnowledgeDocument } from '@/domain/knowledge/KnowledgeDocument';

export interface DocumentStatusTableProps {
  documents: KnowledgeDocument[];
  onDelete?: (documentId: string) => void;
  onTestRagQuery: (document: KnowledgeDocument) => void;
}

export const DocumentStatusTable: React.FC<DocumentStatusTableProps> = ({
  documents,
  onDelete,
  onTestRagQuery,
}) => {
  const getStatusBadge = (doc: KnowledgeDocument) => {
    switch (doc.status) {
      case 'INDEXED':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-400 border-2 border-black font-black text-xs uppercase px-2 py-0.5 shadow-[2px_2px_0px_#000]">
            <span>✓</span> INDEXED
          </span>
        );
      case 'INGESTED':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-400 border-2 border-black font-black text-xs uppercase px-2 py-0.5 shadow-[2px_2px_0px_#000]">
            <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
            INGESTED
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-400 border-2 border-black font-black text-xs uppercase px-2 py-0.5 shadow-[2px_2px_0px_#000]">
            <span>✕</span> FAILED
          </span>
        );
      default:
        return (
          <span className="bg-gray-200 border-2 border-black font-black text-xs uppercase px-2 py-0.5">
            {doc.status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_#000] space-y-4">
      <div className="flex items-center justify-between border-b-2 border-black/20 pb-2">
        <h2 className="text-xl font-black uppercase text-black tracking-tight flex items-center gap-2">
          <span>📚</span> Catálogo de Documentos Indexados
        </h2>
        <span className="font-mono text-xs font-black bg-yellow-300 border-2 border-black px-2 py-0.5 shadow-[2px_2px_0px_#000]">
          {documents.length} ARCHIVOS REGISTRADOS
        </span>
      </div>

      {documents.length === 0 ? (
        <div className="border-3 border-dashed border-black/40 p-8 text-center bg-[#FFFDF8]">
          <p className="font-bold text-gray-600 uppercase text-sm">
            No hay documentos en la base de conocimiento de esta empresa.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border-2 border-black">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black text-white font-mono text-xs uppercase tracking-wider">
                <th className="p-3 border-r border-gray-700">Documento</th>
                <th className="p-3 border-r border-gray-700">Estado</th>
                <th className="p-3 border-r border-gray-700">Chunks Vectoriales</th>
                <th className="p-3 border-r border-gray-700">Tamaño</th>
                <th className="p-3 border-r border-gray-700">Fecha</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black text-sm">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-amber-50/50 transition-colors">
                  <td className="p-3 font-mono font-bold text-black flex items-center gap-2">
                    <span>📄</span>
                    <span className="truncate max-w-[220px]" title={doc.filename}>
                      {doc.filename}
                    </span>
                  </td>
                  <td className="p-3">{getStatusBadge(doc)}</td>
                  <td className="p-3 font-mono font-bold text-black">
                    {doc.isIndexed ? (
                      <span className="bg-cyan-100 border border-black px-2 py-0.5 text-xs">
                        {doc.chunksCount} chunks
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500 italic">En proceso...</span>
                    )}
                  </td>
                  <td className="p-3 font-mono text-xs text-gray-700">
                    {doc.fileSizeFormatted || '—'}
                  </td>
                  <td className="p-3 font-mono text-xs text-gray-600">
                    {doc.createdAt.toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => onTestRagQuery(doc)}
                      className="px-2.5 py-1 bg-yellow-300 hover:bg-yellow-200 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                    >
                      🔍 Simular Cita
                    </button>
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(doc.id)}
                        className="px-2 py-1 bg-gray-200 hover:bg-rose-300 border-2 border-black font-black text-xs shadow-[2px_2px_0px_#000]"
                        title="Eliminar documento"
                      >
                        🗑️
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
