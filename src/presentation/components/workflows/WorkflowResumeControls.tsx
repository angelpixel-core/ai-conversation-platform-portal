import React, { useState } from 'react';
import { AlertTriangle, Play, ShieldAlert } from 'lucide-react';

interface WorkflowResumeControlsProps {
  isResuming?: boolean;
  onResume: (overrideText: string) => void;
}

export const WorkflowResumeControls: React.FC<WorkflowResumeControlsProps> = ({
  isResuming = false,
  onResume,
}) => {
  const [overrideText, setOverrideText] = useState<string>(
    'Aprobado manualmente por el oficial de seguridad tras validar directivas de riesgo.'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideText.trim()) return;
    onResume(overrideText.trim());
  };

  return (
    <div
      data-testid="workflow-resume-controls"
      className="p-5 bg-amber-100 border-4 border-black shadow-neo rounded-xl"
    >
      <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-black">
        <ShieldAlert className="w-5 h-5 text-amber-900" />
        <h4 className="text-sm font-black uppercase tracking-tight text-amber-950">
          Autorización Humana en el Bucle (HITL Gate): Flujo Pausado en Auditor
        </h4>
      </div>

      <p className="text-xs font-medium text-amber-900 mb-3">
        El agente auditor detectó variables de riesgo normativo. Inyecte los parámetros de autorización o justificación del operador para reanudar el grafo hacia el <strong>Sintetizador Ejecutivo</strong>.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label
            htmlFor="override-input"
            className="block text-xs font-mono font-bold text-black uppercase mb-1"
          >
            Justificación / Override del Operador (`supervisor_override`):
          </label>
          <input
            id="override-input"
            type="text"
            value={overrideText}
            onChange={(e) => setOverrideText(e.target.value)}
            disabled={isResuming}
            className="w-full px-3 py-2 bg-white border-2 border-black rounded-lg text-xs font-mono text-black focus:outline-hidden focus:ring-2 focus:ring-yellow-400 shadow-neo-sm disabled:opacity-50"
            placeholder="Ingrese autorización u observaciones de override..."
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isResuming || !overrideText.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 border-2 border-black rounded-lg text-xs font-black uppercase text-black shadow-neo active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            {isResuming ? 'Reanudando Flujo...' : '⚡ Reanudar Flujo hacia Sintetizador'}
          </button>
        </div>
      </form>
    </div>
  );
};
