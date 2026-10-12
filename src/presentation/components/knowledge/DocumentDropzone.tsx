import React, { useState, useRef } from 'react';
import { UploadPayload } from '@/application/knowledge/useKnowledgeManager';

export interface DocumentDropzoneProps {
  onUpload: (file: UploadPayload) => Promise<unknown>;
  isUploading: boolean;
}

export const DocumentDropzone: React.FC<DocumentDropzoneProps> = ({
  onUpload,
  isUploading,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      await onUpload({
        name: file.name,
        type: file.type || 'application/pdf',
        content: `Contenido cargado de ${file.name} listo para vectorización.`,
        sizeFormatted: `${Math.round(file.size / 1024)} KB`,
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      await onUpload({
        name: file.name,
        type: file.type || 'application/pdf',
        content: `Contenido cargado de ${file.name} listo para vectorización.`,
        sizeFormatted: `${Math.round(file.size / 1024)} KB`,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleQuickUpload = (filename: string, content: string, sizeFormatted: string) => {
    onUpload({
      name: filename,
      type: 'application/pdf',
      content,
      sizeFormatted,
    });
  };

  return (
    <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_#000] space-y-4">
      <div className="flex items-center justify-between border-b-2 border-black/20 pb-2">
        <h2 className="text-xl font-black uppercase text-black tracking-tight flex items-center gap-2">
          <span>📂</span> Zona de Ingesta Documental (RAG Ingestion)
        </h2>
        <span className="font-mono text-xs font-black bg-cyan-300 border-2 border-black px-2 py-0.5 shadow-[2px_2px_0px_#000]">
          HTTP 202 ACCEPTED ASYNC
        </span>
      </div>

      {/* Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-3 border-dashed border-black p-8 text-center transition-all cursor-pointer relative ${
          isDragOver
            ? 'bg-amber-200 border-solid shadow-[4px_4px_0px_#000]'
            : 'bg-[#FAF9F6] hover:bg-yellow-50 shadow-[3px_3px_0px_#000]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md"
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="space-y-2">
            <span className="text-4xl block animate-spin">⚙️</span>
            <p className="font-black text-sm uppercase text-black">
              Ingesta asíncrona en curso...
            </p>
            <p className="font-mono text-xs text-gray-600">
              Despachando chunks y calculando embeddings de alta densidad en RabbitMQ
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <span className="text-4xl block transform hover:scale-110 transition-transform">📄</span>
            <p className="font-black text-base uppercase text-black">
              Arrastra documentos o haz clic para subir
            </p>
            <p className="font-mono text-xs text-gray-600 font-bold">
              Formatos aceptados: <span className="bg-white px-1.5 py-0.5 border border-black">PDF, DOCX, TXT, MD</span>
            </p>
          </div>
        )}
      </div>

      {/* Quick Testing Triggers */}
      <div className="pt-2">
        <span className="block font-black text-xs uppercase text-gray-600 mb-2">
          Carga Rápida de Archivos de Prueba (Simulador RAG):
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isUploading}
            onClick={() =>
              handleQuickUpload(
                'manual_mantenimiento_maquinas.pdf',
                'Instrucciones de descalcificación y ajuste de muelas para molinos volumétricos.',
                '680 KB'
              )
            }
            className="border-2 border-black bg-amber-300 hover:bg-amber-200 font-black text-xs uppercase px-3 py-1.5 shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50"
          >
            + Subir Manual de Mantenimiento
          </button>
          <button
            type="button"
            disabled={isUploading}
            onClick={() =>
              handleQuickUpload(
                'protocolo_sanitario_alimentos.pdf',
                'Estándares HACCP para control microbiológico en leche y siropes.',
                '410 KB'
              )
            }
            className="border-2 border-black bg-lime-300 hover:bg-lime-200 font-black text-xs uppercase px-3 py-1.5 shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50"
          >
            + Subir Protocolo Sanitario
          </button>
          <button
            type="button"
            disabled={isUploading}
            onClick={() =>
              handleQuickUpload(
                'faq_atencion_corporativa.docx',
                'Respuestas frecuentes a incidencias de facturación B2B.',
                '220 KB'
              )
            }
            className="border-2 border-black bg-purple-300 hover:bg-purple-200 font-black text-xs uppercase px-3 py-1.5 shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50"
          >
            + Subir FAQ Corporativo
          </button>
        </div>
      </div>
    </div>
  );
};
