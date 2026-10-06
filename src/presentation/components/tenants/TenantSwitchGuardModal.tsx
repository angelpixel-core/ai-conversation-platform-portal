import React, { useEffect } from 'react';
import { Tenant } from '@/domain/tenants/Tenant';
import { TenantAvatar } from './TenantAvatar';
import { TenantTierBadge } from './TenantTierBadge';
import { AlertTriangle, ArrowRight, X, ShieldAlert } from 'lucide-react';

export interface TenantSwitchGuardModalProps {
  isOpen: boolean;
  currentTenant: Tenant | null;
  targetTenant: Tenant | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const TenantSwitchGuardModal: React.FC<TenantSwitchGuardModalProps> = ({
  isOpen,
  currentTenant,
  targetTenant,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen || !targetTenant) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tenant-guard-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-neo-lg p-6 relative flex flex-col gap-5 text-black dark:text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black dark:border-zinc-700 pb-3">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <ShieldAlert className="w-6 h-6 stroke-[2.5]" />
            <h2 id="tenant-guard-title" className="text-xl font-black uppercase tracking-wider text-black dark:text-white">
              Cambio de Espacio de Trabajo
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cerrar modal"
            className="p-1 border-2 border-black bg-amber-300 text-black shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        {/* Warning Callout */}
        <div className="border-2 border-black bg-amber-100 dark:bg-amber-950/40 p-4 flex gap-3 shadow-neo-sm">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
          <div className="text-sm font-medium leading-relaxed">
            <p className="font-black text-amber-950 dark:text-amber-200 uppercase text-xs">
              Prevención de Fuga de Datos (Data Isolation)
            </p>
            <p className="text-xs text-amber-900 dark:text-amber-300 mt-1">
              Tienes una sesión o conversación en curso. Se limpiará la conversación y estado en memoria
              para evitar que datos de una organización se filtren en otra.
            </p>
          </div>
        </div>

        {/* Tenant Transition Card */}
        <div className="border-2 border-black p-4 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-between gap-4">
          {currentTenant && (
            <div className="flex items-center gap-3 min-w-0">
              <TenantAvatar tenant={currentTenant} size="sm" />
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase text-zinc-500 font-bold">Actual</p>
                <p className="text-sm font-black truncate">{currentTenant.name}</p>
                <TenantTierBadge tier={currentTenant.tier} className="mt-0.5" />
              </div>
            </div>
          )}

          <div className="p-2 bg-yellow-300 border-2 border-black shadow-neo-xs shrink-0">
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </div>

          <div className="flex items-center gap-3 min-w-0 text-right">
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase text-zinc-500 font-bold">Destino</p>
              <p className="text-sm font-black truncate">{targetTenant.name}</p>
              <TenantTierBadge tier={targetTenant.tier} className="mt-0.5" />
            </div>
            <TenantAvatar tenant={targetTenant} size="sm" />
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 border-t-2 border-black dark:border-zinc-700 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-black uppercase bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white border-2 border-black shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-black uppercase bg-amber-400 text-black border-2 border-black shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
          >
            Confirmar Cambio
          </button>
        </div>
      </div>
    </div>
  );
};
