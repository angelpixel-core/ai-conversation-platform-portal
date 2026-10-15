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
        <div className="flex items-center justify-between border-b-3 border-black dark:border-zinc-700 pb-3">
          <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
            <div className="p-1.5 bg-amber-300 border-2 border-black shadow-[2px_2px_0px_#000] text-black">
              <ShieldAlert className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 id="tenant-guard-title" className="text-lg font-black uppercase tracking-wider text-black dark:text-white leading-tight">
                Cambio de Espacio de Trabajo
              </h2>
              <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                Protocolo de Aislamiento de Memoria
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cerrar modal"
            className="p-1.5 border-2 border-black bg-rose-300 hover:bg-rose-400 text-black shadow-[2px_2px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none active:shadow-none transition-all cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Warning Callout */}
        <div className="border-2 border-black bg-amber-200 dark:bg-amber-950/60 p-3.5 flex gap-3 shadow-[3px_3px_0px_#000]">
          <AlertTriangle className="w-5 h-5 text-amber-900 dark:text-amber-300 shrink-0 mt-0.5" />
          <div className="text-xs font-medium leading-relaxed text-amber-950 dark:text-amber-200">
            <p className="font-black uppercase tracking-wider">
              Prevención de Fuga de Datos (Multi-Tenant Isolation)
            </p>
            <p className="mt-1 text-zinc-800 dark:text-zinc-300">
              Tienes una sesión o conversación en curso. Se limpiará la conversación y estado en memoria para evitar que datos o credenciales de una organización se filtren en otra.
            </p>
          </div>
        </div>

        {/* Tenant Transition Comparative Grid */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1">
          {currentTenant && (
            <div className="flex-1 border-2 border-black p-3 bg-zinc-50 dark:bg-zinc-800 shadow-[3px_3px_0px_#000] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono font-black uppercase tracking-wider bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 border border-black text-zinc-700 dark:text-zinc-300">
                  Organización Actual
                </span>
                <TenantTierBadge tier={currentTenant.tier} />
              </div>
              <div className="flex items-center gap-2.5">
                <TenantAvatar tenant={currentTenant} size="sm" />
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase text-black dark:text-white truncate">
                    {currentTenant.name}
                  </p>
                  <p className="text-[10px] font-mono text-zinc-500 font-bold truncate">
                    {currentTenant.id.value}
                  </p>
                </div>
              </div>
              {currentTenant.formattedBalance && (
                <div className="text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400 border-t border-black/10 pt-1 flex justify-between">
                  <span>Balance:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-black">{currentTenant.formattedBalance}</span>
                </div>
              )}
            </div>
          )}

          <div className="self-center p-2 bg-amber-300 border-2 border-black shadow-[2px_2px_0px_#000] text-black shrink-0">
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </div>

          <div className="flex-1 border-2 border-black p-3 bg-amber-50 dark:bg-amber-950/20 shadow-[3px_3px_0px_#000] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono font-black uppercase tracking-wider bg-amber-200 dark:bg-amber-900/60 px-1.5 py-0.5 border border-black text-amber-950 dark:text-amber-300">
                Organización Destino
              </span>
              <TenantTierBadge tier={targetTenant.tier} />
            </div>
            <div className="flex items-center gap-2.5">
              <TenantAvatar tenant={targetTenant} size="sm" />
              <div className="min-w-0">
                <p className="text-xs font-black uppercase text-black dark:text-white truncate">
                  {targetTenant.name}
                </p>
                <p className="text-[10px] font-mono text-zinc-500 font-bold truncate">
                  {targetTenant.id.value}
                </p>
              </div>
            </div>
            {targetTenant.formattedBalance && (
              <div className="text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400 border-t border-black/10 pt-1 flex justify-between">
                <span>Balance:</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-black">{targetTenant.formattedBalance}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 border-t-2 border-black dark:border-zinc-700 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-black uppercase bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white border-2 border-black shadow-[2px_2px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none active:shadow-none transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2 text-xs font-black uppercase bg-amber-400 hover:bg-amber-300 text-black border-2 border-black shadow-[3px_3px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none active:shadow-none transition-all cursor-pointer font-black tracking-wider"
          >
            Confirmar Cambio
          </button>
        </div>
      </div>
    </div>
  );
};
