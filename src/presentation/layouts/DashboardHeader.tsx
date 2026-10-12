'use client';

import React, { useState } from 'react';
import { useSystemHealth } from '@/application/health/useSystemHealth';
import { useTenant } from '@/application/tenants/TenantContext';
import { useConversation, CONVERSATION_QUERY_KEY } from '@/application/conversations/useConversation';
import { useQueryClient } from '@tanstack/react-query';
import { SystemStatusPill } from '@/presentation/components/health/SystemStatusPill';
import { SystemStatusModal } from '@/presentation/components/health/SystemStatusModal';
import { TenantSelectorDropdown } from '@/presentation/components/tenants/TenantSelectorDropdown';
import { TenantSwitchGuardModal } from '@/presentation/components/tenants/TenantSwitchGuardModal';
import { SystemHealth } from '@/domain/health/SystemHealth';
import { Bot, Layers } from 'lucide-react';

export const DashboardHeader: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: healthData, isLoading: isHealthLoading, isError: isHealthError, refetch, isFetching } = useSystemHealth();
  const {
    activeTenant,
    tenants,
    isLoading: isTenantLoading,
    requestSwitchTenant,
    pendingTenant,
    isSwitchGuardOpen,
    confirmSwitchTenant,
    cancelSwitchTenant,
  } = useTenant();

  const { data: conversation } = useConversation('conv-cloud-1');
  const hasActiveConversation = (conversation?.messages?.length ?? 0) > 0;

  const isMockMode = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

  const health =
    healthData ??
    (isHealthLoading
      ? new SystemHealth('CHECKING', 0, new Date())
      : isHealthError
      ? new SystemHealth('DOWN', 0, new Date(), [{ name: 'api', status: 'DOWN', message: 'Failed to connect' }])
      : new SystemHealth('CHECKING', 0, new Date()));

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-amber-300 border-b-4 border-black px-4 sm:px-8 py-3 shadow-neo flex flex-wrap items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white border-2 border-black shadow-neo-sm flex items-center justify-center -rotate-2">
            <Bot className="w-6 h-6 text-black stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black uppercase tracking-wider text-black">
                Coffee Chatbot
              </h1>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-black uppercase bg-black text-amber-300 border border-black">
                PORTAL v1.0
              </span>
            </div>
            <p className="text-xs font-mono font-bold text-black/80 flex items-center gap-1">
              <Layers className="w-3 h-3 inline" /> AI Conversation Engine
            </p>
          </div>
        </div>

        {/* Right Actions: Tenant Selector, Environment & Health */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Tenant Selector Dropdown */}
          <TenantSelectorDropdown
            activeTenant={activeTenant}
            tenants={tenants}
            onSelectTenant={(target) => requestSwitchTenant(target, hasActiveConversation)}
            isLoading={isTenantLoading}
          />

          {/* Mock / Live indicator */}
          <span
            className={`px-2 py-1 text-[11px] font-black uppercase tracking-wider border-2 border-black shadow-neo-sm ${
              isMockMode ? 'bg-purple-300 text-purple-950' : 'bg-emerald-300 text-emerald-950'
            }`}
          >
            {isMockMode ? 'MOCK MODE' : 'LIVE API'}
          </span>

          {/* System Health Pill */}
          <SystemStatusPill health={health} onClick={() => setIsModalOpen(true)} />
        </div>
      </header>

      {/* Health Diagnostic Modal */}
      <SystemStatusModal
        isOpen={isModalOpen}
        health={health}
        onClose={() => setIsModalOpen(false)}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
      />

      {/* Tenant Switch Guard Modal */}
      <TenantSwitchGuardModal
        isOpen={isSwitchGuardOpen}
        currentTenant={activeTenant}
        targetTenant={pendingTenant}
        onConfirm={() =>
          confirmSwitchTenant(() => {
            queryClient.invalidateQueries({ queryKey: CONVERSATION_QUERY_KEY('conv-cloud-1') });
          })
        }
        onCancel={cancelSwitchTenant}
      />
    </>
  );
};
