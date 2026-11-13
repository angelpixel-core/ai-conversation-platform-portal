import React, { useState, FormEvent } from 'react';
import { MessageSquarePlus, X, Loader2, Sparkles } from 'lucide-react';

export interface CreateConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string) => Promise<void> | void;
  isCreating?: boolean;
}

export const CreateConversationModal: React.FC<CreateConversationModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  isCreating = false,
}) => {
  const [title, setTitle] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || isCreating) return;
    await onCreate(trimmed);
    setTitle('');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-conversation-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div className="w-full max-w-md bg-white border-4 border-black shadow-[6px_6px_0px_#000] p-6 text-black animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-black mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-400 border-2 border-black shadow-[2px_2px_0px_#000]">
              <MessageSquarePlus className="w-5 h-5 text-black stroke-[2.5]" />
            </div>
            <h3 id="create-conversation-title" className="text-lg font-black uppercase tracking-wide">
              Nueva Conversación
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isCreating}
            aria-label="Cerrar modal"
            className="p-1.5 bg-zinc-100 hover:bg-zinc-200 border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="conversation-title-input" className="block text-xs font-mono font-bold uppercase text-black/80 mb-1.5">
              Título de la Conversación
            </label>
            <input
              id="conversation-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Migración Kubernetes Enterprise"
              autoFocus
              disabled={isCreating}
              className="w-full px-4 py-3 bg-zinc-50 border-2 border-black font-bold text-sm text-black placeholder:text-zinc-500 shadow-[2px_2px_0px_#000] focus:outline-none focus:shadow-[4px_4px_0px_#000] focus:bg-white transition-all disabled:opacity-50"
            />
            <p className="mt-1 text-[11px] font-mono text-zinc-600 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Se generará una clave criptográfica Idempotency-Key (UUIDv4) para el aprovisionamiento.
            </p>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-black">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-black font-black uppercase text-xs tracking-wider border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCreating || title.trim().length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-black font-black uppercase text-xs tracking-wider border-2 border-black shadow-[3px_3px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
                  <span>Creando...</span>
                </>
              ) : (
                <>
                  <MessageSquarePlus className="w-4 h-4 stroke-[2.5]" />
                  <span>Crear Hilo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
