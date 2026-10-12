'use client';

import React from 'react';
import { MonetaryBudget } from '@/domain/governance/MonetaryBudget';
import { CreditCard, AlertTriangle, ShieldAlert, CheckCircle2, DollarSign } from 'lucide-react';

interface TokenBudgetMeterProps {
  budget: MonetaryBudget | null;
  isLoading?: boolean;
}

export const TokenBudgetMeter: React.FC<TokenBudgetMeterProps> = ({ budget, isLoading }) => {
  if (isLoading || !budget) {
    return (
      <div className="border-4 border-black p-6 bg-white shadow-neo-lg animate-pulse space-y-4">
        <div className="h-6 bg-zinc-200 w-1/3 border-2 border-black" />
        <div className="h-10 bg-zinc-100 border-2 border-black" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-16 bg-zinc-100 border-2 border-black" />
          <div className="h-16 bg-zinc-100 border-2 border-black" />
          <div className="h-16 bg-zinc-100 border-2 border-black" />
        </div>
      </div>
    );
  }

  const { balance, reservedAmount, availableBalance, currency, usagePercentage, isLowBudget, isExhausted } = budget;

  // Segment widths in percentage
  const reservedPct = balance > 0 ? Math.min(100, (reservedAmount / balance) * 100) : 0;
  const availablePct = balance > 0 ? Math.max(0, (availableBalance / balance) * 100) : 0;

  return (
    <div className="border-4 border-black p-6 bg-white shadow-neo-lg text-black space-y-6">
      {/* Header and Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-300 border-2 border-black shadow-neo-xs">
            <CreditCard className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight">Presupuesto de Tokens</h3>
            <p className="text-xs font-mono font-bold text-zinc-600">
              Tenant: <span className="text-black bg-zinc-100 px-1 border border-black">{budget.tenantId}</span>
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div>
          {isExhausted ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-400 text-black border-2 border-black font-mono text-xs font-black shadow-neo-xs animate-pulse">
              <ShieldAlert className="w-4 h-4" /> CUOTA AGOTADA (402)
            </span>
          ) : isLowBudget ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-300 text-black border-2 border-black font-mono text-xs font-black shadow-neo-xs">
              <AlertTriangle className="w-4 h-4" /> SALDO BAJO (&lt;15%)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-300 text-black border-2 border-black font-mono text-xs font-black shadow-neo-xs">
              <CheckCircle2 className="w-4 h-4" /> SALDO SALUDABLE
            </span>
          )}
        </div>
      </div>

      {/* Numerical Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Balance */}
        <div className="p-4 bg-zinc-50 border-2 border-black shadow-neo-sm">
          <div className="text-[11px] font-mono font-bold text-zinc-600 uppercase">Techo Mensual</div>
          <div className="text-2xl font-black font-mono mt-1">
            ${balance.toFixed(2)} <span className="text-xs">{currency}</span>
          </div>
          <div className="text-[10px] font-mono text-zinc-500 mt-1">Límite asignado por contrato</div>
        </div>

        {/* Card 2: Reserved In-Flight */}
        <div className="p-4 bg-amber-50 border-2 border-black shadow-neo-sm">
          <div className="text-[11px] font-mono font-bold text-amber-800 uppercase flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Reservado (In-Flight)
          </div>
          <div className="text-2xl font-black font-mono mt-1 text-amber-900">
            ${reservedAmount.toFixed(2)} <span className="text-xs">{currency}</span>
          </div>
          <div className="text-[10px] font-mono text-amber-700 mt-1">{reservedPct.toFixed(1)}% comprometido</div>
        </div>

        {/* Card 3: Available Balance */}
        <div className="p-4 bg-emerald-50 border-2 border-black shadow-neo-sm">
          <div className="text-[11px] font-mono font-bold text-emerald-800 uppercase flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Saldo Disponible
          </div>
          <div className="text-2xl font-black font-mono mt-1 text-emerald-900">
            ${availableBalance.toFixed(2)} <span className="text-xs">{currency}</span>
          </div>
          <div className="text-[10px] font-mono text-emerald-700 mt-1">{availablePct.toFixed(1)}% disponible</div>
        </div>
      </div>

      {/* Segmented 3D Neubrutalism Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono font-bold">
          <span>Distribución de Cuota</span>
          <span className="px-1.5 py-0.5 bg-black text-white text-[11px]">
            {usagePercentage}% RESERVADO
          </span>
        </div>

        <div className="h-8 w-full bg-zinc-200 border-3 border-black flex overflow-hidden shadow-neo-sm">
          {/* Available Segment */}
          <div
            style={{ width: `${availablePct}%` }}
            title={`Disponible: $${availableBalance.toFixed(2)} USD`}
            className="bg-emerald-400 border-r-2 border-black flex items-center justify-center transition-all duration-500"
          >
            {availablePct > 15 && (
              <span className="text-[11px] font-mono font-black text-black truncate px-1">
                DISPONIBLE ({Math.round(availablePct)}%)
              </span>
            )}
          </div>

          {/* Reserved Segment */}
          <div
            style={{ width: `${reservedPct}%` }}
            title={`Reservado: $${reservedAmount.toFixed(2)} USD`}
            className="bg-amber-400 flex items-center justify-center transition-all duration-500"
          >
            {reservedPct > 12 && (
              <span className="text-[11px] font-mono font-black text-black truncate px-1">
                RESERVADO ({Math.round(reservedPct)}%)
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 pt-1">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-emerald-400 border border-black inline-block" /> Saldo Disponible
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-amber-400 border border-black inline-block" /> Cuota Reservada
          </span>
        </div>
      </div>
    </div>
  );
};
