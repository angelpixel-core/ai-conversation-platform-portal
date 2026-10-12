'use client';

import React, { useState } from 'react';
import { useTenant } from '@/application/tenants/TenantContext';
import { useTenantGovernance } from '@/application/governance/useTenantGovernance';
import { TokenBudgetMeter } from './TokenBudgetMeter';
import { PolicyConfigForm } from './PolicyConfigForm';
import { QuotaExceededModal } from './QuotaExceededModal';
import {
  CreditCard,
  ShieldCheck,
  Zap,
  Play,
  AlertOctagon,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const GovernanceDashboardPanel: React.FC = () => {
  const { activeTenant } = useTenant();
  const currentTenantId = activeTenant ? activeTenant.id.value : 'corp-acme';

  const {
    budget,
    policy,
    isLoading,
    isSavingPolicy,
    isReserving,
    quotaExceededError,
    successMessage,
    clearQuotaError,
    updatePolicy,
    reserveBudget,
    refetch,
  } = useTenantGovernance({ tenantId: currentTenantId });

  const [lastReservationInfo, setLastReservationInfo] = useState<string | null>(null);

  const handleSimulateNormal = async () => {
    setLastReservationInfo(null);
    const res = await reserveBudget(0.5, 'gpt-4o-mini');
    if (res) {
      setLastReservationInfo(`Inferencia aprobada: $0.50 USD reservados en ${currentTenantId}`);
    }
  };

  const handleSimulateHeavy = async () => {
    setLastReservationInfo(null);
    const res = await reserveBudget(75.0, 'gpt-4o');
    if (res) {
      setLastReservationInfo(`Inferencia pesada aprobada: $75.00 USD reservados en ${currentTenantId}`);
    }
  };

  const handleSimulateExceeded = async () => {
    setLastReservationInfo(null);
    // Attempts to reserve $99,999 USD, exceeding budget and triggering HTTP 402
    await reserveBudget(99999.0, 'gpt-4o');
  };

  return (
    <div className="flex flex-col space-y-6 text-black">
      {/* Panel Top Header */}
      <div className="bg-rose-200 border-4 border-black p-5 sm:p-6 shadow-neo-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-white border-2 border-black shadow-neo-xs">
            <CreditCard className="w-7 h-7 stroke-[2.5] text-rose-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
                Gobernanza de Tokens & Presupuestos
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono font-black uppercase bg-black text-rose-300">
                CU-05 STEP 5
              </span>
            </div>
            <p className="text-xs font-mono font-bold text-black/80 mt-0.5">
              Control de Costos por Inferencia, Asignación de Tiers y Detección Preventiva HTTP 402
            </p>
          </div>
        </div>

        {/* Simulation Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isReserving}
            onClick={handleSimulateNormal}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-400 hover:bg-emerald-500 text-black font-black uppercase text-xs border-2 border-black shadow-neo-xs hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            Simular Inferencia ($0.50)
          </button>

          <button
            type="button"
            disabled={isReserving}
            onClick={handleSimulateHeavy}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-300 hover:bg-amber-400 text-black font-black uppercase text-xs border-2 border-black shadow-neo-xs hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Simular Larga ($75.00)
          </button>

          <button
            type="button"
            disabled={isReserving}
            onClick={handleSimulateExceeded}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-400 hover:bg-red-500 text-black font-black uppercase text-xs border-2 border-black shadow-neo hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            Simular Exceso (HTTP 402)
          </button>

          <button
            type="button"
            onClick={() => refetch()}
            aria-label="Refrescar Gobernanza"
            className="p-2 bg-white hover:bg-zinc-100 border-2 border-black shadow-neo-xs cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Reservation Notification */}
      {lastReservationInfo && (
        <div
          role="status"
          className="p-3.5 bg-emerald-100 border-2 border-black font-mono text-xs font-black flex items-center justify-between shadow-neo-xs"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-800" />
            {lastReservationInfo}
          </span>
          <button
            type="button"
            onClick={() => setLastReservationInfo(null)}
            className="underline hover:opacity-75 cursor-pointer"
          >
            Ocultar
          </button>
        </div>
      )}

      {/* Main Grid: Meter + Policy Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TokenBudgetMeter budget={budget} isLoading={isLoading} />
        <PolicyConfigForm
          policy={policy}
          isLoading={isLoading}
          isSaving={isSavingPolicy}
          successMessage={successMessage}
          onSave={updatePolicy}
        />
      </div>

      {/* HTTP 402 Quota Exceeded Modal */}
      <QuotaExceededModal
        isOpen={Boolean(quotaExceededError)}
        tenantId={currentTenantId}
        requestedCost={quotaExceededError?.requestedCost}
        availableBalance={quotaExceededError?.availableBalance}
        errorMessage={quotaExceededError?.message}
        onClose={clearQuotaError}
        onRequestCredit={() => {
          // Instant top-up simulated credit
          clearQuotaError();
          refetch();
        }}
      />
    </div>
  );
};
