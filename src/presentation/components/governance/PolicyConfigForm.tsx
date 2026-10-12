'use client';

import React, { useState, useEffect } from 'react';
import { TenantPolicy, TenantTier } from '@/domain/governance/TenantPolicy';
import { UpdateTenantPolicyDto } from '@/domain/governance/GovernanceGateway';
import { Sliders, CheckCircle2, Shield, Cpu, Save } from 'lucide-react';

const AVAILABLE_MODELS = [
  { id: 'gpt-4o', label: 'GPT-4o (OpenAI Flagship)', costPer1k: '$0.005' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini (Velocidad & Costo)', costPer1k: '$0.0003' },
  { id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet (Razonamiento)', costPer1k: '$0.006' },
  { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Multimodal 1M)', costPer1k: '$0.0035' },
];

const TIERS: { id: TenantTier; label: string; badgeClass: string }[] = [
  { id: 'FREE', label: 'Free Tier', badgeClass: 'bg-zinc-200' },
  { id: 'PRO', label: 'Pro Business', badgeClass: 'bg-blue-300' },
  { id: 'ENTERPRISE', label: 'Enterprise VIP', badgeClass: 'bg-amber-300' },
];

interface PolicyConfigFormProps {
  policy: TenantPolicy | null;
  isLoading?: boolean;
  isSaving?: boolean;
  successMessage?: string | null;
  onSave: (dto: UpdateTenantPolicyDto) => Promise<unknown>;
}

export const PolicyConfigForm: React.FC<PolicyConfigFormProps> = ({
  policy,
  isLoading,
  isSaving,
  successMessage,
  onSave,
}) => {
  const [tier, setTier] = useState<TenantTier>('PRO');
  const [maxTokens, setMaxTokens] = useState<number>(4096);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(1000);
  const [allowedModels, setAllowedModels] = useState<string[]>(['gpt-4o', 'gpt-4o-mini']);

  useEffect(() => {
    if (policy) {
      setTier(policy.tier);
      setMaxTokens(policy.maxTokensPerRequest);
      setMonthlyBudget(policy.monthlyBudgetUsd);
      setAllowedModels(policy.allowedModels);
    }
  }, [policy]);

  const handleToggleModel = (modelId: string) => {
    setAllowedModels((prev) => {
      if (prev.includes(modelId)) {
        // Prevent deselecting all models
        if (prev.length === 1) return prev;
        return prev.filter((m) => m !== modelId);
      }
      return [...prev, modelId];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      tier,
      maxTokensPerRequest: maxTokens,
      monthlyBudgetUsd: monthlyBudget,
      allowedModels,
    });
  };

  if (isLoading || !policy) {
    return (
      <div className="border-4 border-black p-6 bg-white shadow-neo-lg animate-pulse space-y-4">
        <div className="h-6 bg-zinc-200 w-1/4 border-2 border-black" />
        <div className="h-20 bg-zinc-100 border-2 border-black" />
        <div className="h-20 bg-zinc-100 border-2 border-black" />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-4 border-black p-6 bg-white shadow-neo-lg text-black space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-black pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-yellow-300 border-2 border-black shadow-neo-xs">
            <Sliders className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight">Políticas del Tenant</h3>
            <p className="text-xs font-mono font-bold text-zinc-600">
              Reglas de Ruteo, Modelos y Techos de Inferencia (RFC-06)
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 text-xs font-mono font-black uppercase bg-black text-white">
          POLICY ENGINE
        </span>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div
          role="status"
          className="p-3 bg-emerald-200 border-2 border-black font-mono text-xs font-black flex items-center gap-2 shadow-neo-xs"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-800" />
          {successMessage}
        </div>
      )}

      {/* 1. Tier Selection */}
      <div className="space-y-2">
        <label className="block text-xs font-mono font-black uppercase">Nivel de Suscripción (Tier)</label>
        <div className="grid grid-cols-3 gap-3">
          {TIERS.map((t) => {
            const isSelected = tier === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTier(t.id)}
                className={`p-3 border-2 border-black font-mono text-xs font-black uppercase transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  isSelected
                    ? `${t.badgeClass} shadow-neo -translate-y-0.5`
                    : 'bg-zinc-50 hover:bg-zinc-100 shadow-neo-xs'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Max Tokens Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="max-tokens-slider" className="text-xs font-mono font-black uppercase">
            Límite de Tokens por Consulta (max_tokens)
          </label>
          <span className="font-mono text-sm font-black bg-zinc-100 px-2 py-0.5 border border-black">
            {maxTokens.toLocaleString()} tokens
          </span>
        </div>
        <input
          id="max-tokens-slider"
          type="range"
          min="512"
          max="16384"
          step="512"
          value={maxTokens}
          onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
          className="w-full accent-black cursor-pointer"
        />
        <div className="flex justify-between text-[10px] font-mono text-zinc-500">
          <span>512 (Rápido)</span>
          <span>4,096 (Estándar)</span>
          <span>8,192 (Avanzado)</span>
          <span>16,384 (Extenso)</span>
        </div>
      </div>

      {/* 3. Monthly Budget Cap Input */}
      <div className="space-y-2">
        <label htmlFor="monthly-budget-input" className="block text-xs font-mono font-black uppercase">
          Presupuesto Máximo Mensual ($ USD)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-2.5 font-mono font-black text-zinc-500">$</span>
          <input
            id="monthly-budget-input"
            type="number"
            min="10"
            max="50000"
            step="10"
            value={monthlyBudget}
            onChange={(e) => setMonthlyBudget(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full pl-8 pr-4 py-2 bg-white border-2 border-black font-mono font-bold text-sm shadow-neo-xs focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
      </div>

      {/* 4. Allowed Models Checkboxes */}
      <div className="space-y-2">
        <label className="block text-xs font-mono font-black uppercase">
          Modelos Habilitados para el Tenant (Policy Routing)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {AVAILABLE_MODELS.map((model) => {
            const isChecked = allowedModels.includes(model.id);
            return (
              <label
                key={model.id}
                className={`p-3 border-2 border-black flex items-center justify-between cursor-pointer transition-all ${
                  isChecked
                    ? 'bg-amber-100 shadow-neo-xs -translate-y-0.5'
                    : 'bg-zinc-50 hover:bg-zinc-100 opacity-70'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleModel(model.id)}
                    className="accent-black w-4 h-4 rounded cursor-pointer"
                  />
                  <div>
                    <span className="font-mono text-xs font-black block">{model.id}</span>
                    <span className="text-[10px] text-zinc-600 font-medium block">
                      {model.label}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 bg-white px-1.5 py-0.5 border border-black">
                  {model.costPer1k}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="w-full sm:w-auto px-6 py-3 bg-black text-amber-300 font-mono text-xs font-black uppercase tracking-wider border-2 border-black shadow-neo hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Guardando...' : 'Guardar Cambios de Política'}
        </button>
      </div>
    </form>
  );
};
