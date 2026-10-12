'use client';

import React from 'react';
import { AlertOctagon, X, ArrowUpRight, DollarSign } from 'lucide-react';

interface QuotaExceededModalProps {
  isOpen: boolean;
  tenantId: string;
  requestedCost?: number;
  availableBalance?: number;
  errorMessage?: string;
  onClose: () => void;
  onRequestCredit?: () => void;
}

export const QuotaExceededModal: React.FC<QuotaExceededModalProps> = ({
  isOpen,
  tenantId,
  requestedCost,
  availableBalance,
  errorMessage,
  onClose,
  onRequestCredit,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quota-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-lg bg-white border-4 border-black p-6 shadow-neo-lg space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Bar */}
        <div className="flex items-start justify-between border-b-2 border-black pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-400 border-2 border-black shadow-neo-xs">
              <AlertOctagon className="w-6 h-6 stroke-[2.5] text-black" />
            </div>
            <div>
              <span className="px-2 py-0.5 bg-black text-amber-300 font-mono text-[10px] font-black uppercase">
                HTTP 402 PAYMENT REQUIRED
              </span>
              <h3 id="quota-modal-title" className="text-xl font-black uppercase tracking-tight text-black mt-0.5">
                Cuota de Tokens Excedida
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de cuota"
            className="p-1.5 bg-zinc-100 hover:bg-zinc-200 border-2 border-black shadow-neo-xs cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message and Description */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-black/85 leading-relaxed">
            {errorMessage ||
              `El tenant '${tenantId}' no dispone de saldo suficiente para cubrir el costo proyectado de esta inferencia. La operación ha sido rechazada para prevenir sobrecostos no autorizados.`}
          </p>

          {/* Details Breakdown */}
          <div className="p-3.5 bg-red-50 border-2 border-black space-y-2 font-mono text-xs">
            <div className="flex justify-between items-center text-zinc-700">
              <span>Tenant ID:</span>
              <span className="font-black text-black">{tenantId}</span>
            </div>
            {requestedCost !== undefined && (
              <div className="flex justify-between items-center text-red-700">
                <span>Costo Estimado de la Consulta:</span>
                <span className="font-black text-red-900">${requestedCost.toFixed(2)} USD</span>
              </div>
            )}
            {availableBalance !== undefined && (
              <div className="flex justify-between items-center text-zinc-700">
                <span>Saldo Disponible Actual:</span>
                <span className="font-black text-black">${availableBalance.toFixed(2)} USD</span>
              </div>
            )}
            <div className="border-t border-black/20 pt-1.5 flex justify-between items-center font-bold text-black">
              <span>Estado Operativo:</span>
              <span className="text-red-700">INFERENCIA BLOQUEADA</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 bg-zinc-200 hover:bg-zinc-300 text-black font-black uppercase text-xs border-2 border-black shadow-neo-xs cursor-pointer"
          >
            Cerrar
          </button>
          {onRequestCredit && (
            <button
              type="button"
              onClick={onRequestCredit}
              className="w-full sm:w-auto px-4 py-2.5 bg-yellow-300 hover:bg-yellow-400 text-black font-black uppercase text-xs border-2 border-black shadow-neo hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <DollarSign className="w-4 h-4 stroke-[2.5]" />
              Solicitar Ampliación de Saldo
              <ArrowUpRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
