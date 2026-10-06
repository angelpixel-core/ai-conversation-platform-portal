'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Tenant } from '@/domain/tenants/Tenant';
import { useTenantsList } from './useTenantsList';
import { tenantSessionStore } from '@/infrastructure/storage/tenantSessionStore';

export interface TenantContextType {
  activeTenant: Tenant | null;
  tenants: Tenant[];
  isLoading: boolean;
  setActiveTenant: (tenant: Tenant) => void;
  pendingTenant: Tenant | null;
  isSwitchGuardOpen: boolean;
  requestSwitchTenant: (target: Tenant, hasActiveConversation?: boolean) => void;
  confirmSwitchTenant: (onResetState?: () => void) => void;
  cancelSwitchTenant: () => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data: tenants = [], isLoading } = useTenantsList();
  const [activeTenant, setActiveTenantState] = useState<Tenant | null>(null);
  const [pendingTenant, setPendingTenant] = useState<Tenant | null>(null);
  const [isSwitchGuardOpen, setIsSwitchGuardOpen] = useState(false);

  // Initialize or restore active tenant once tenants list is available
  useEffect(() => {
    if (isLoading || tenants.length === 0) return;

    if (!activeTenant) {
      const storedId = tenantSessionStore.getActiveTenantId();
      const matched = storedId ? tenants.find((t) => t.id.equals(storedId)) : null;
      const initial = matched ?? tenants[0];
      setActiveTenantState(initial);
      tenantSessionStore.setActiveTenantId(initial.id);
    }
  }, [tenants, isLoading, activeTenant]);

  const setActiveTenant = (tenant: Tenant) => {
    setActiveTenantState(tenant);
    tenantSessionStore.setActiveTenantId(tenant.id);
  };

  const requestSwitchTenant = (target: Tenant, hasActiveConversation = false) => {
    if (activeTenant && activeTenant.id.equals(target.id)) return;

    if (hasActiveConversation) {
      setPendingTenant(target);
      setIsSwitchGuardOpen(true);
    } else {
      setActiveTenant(target);
    }
  };

  const confirmSwitchTenant = (onResetState?: () => void) => {
    if (pendingTenant) {
      setActiveTenant(pendingTenant);
      setPendingTenant(null);
    }
    setIsSwitchGuardOpen(false);
    if (onResetState) {
      onResetState();
    }
  };

  const cancelSwitchTenant = () => {
    setPendingTenant(null);
    setIsSwitchGuardOpen(false);
  };

  return (
    <TenantContext.Provider
      value={{
        activeTenant,
        tenants,
        isLoading,
        setActiveTenant,
        pendingTenant,
        isSwitchGuardOpen,
        requestSwitchTenant,
        confirmSwitchTenant,
        cancelSwitchTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export function useTenant(): TenantContextType {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
