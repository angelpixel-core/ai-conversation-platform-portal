'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Tenant } from '@/domain/tenants/Tenant';
import { TenantId } from '@/domain/tenants/TenantId';
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

const DEFAULT_FALLBACK_TENANTS: Tenant[] = [
  new Tenant(
    TenantId.create('corp-acme'),
    'Acme Corporation',
    'ENTERPRISE',
    new Date('2026-09-20T10:00:00Z')
  ),
  new Tenant(
    TenantId.create('corp-globex'),
    'Globex Industries',
    'PRO',
    new Date('2026-09-22T14:30:00Z')
  ),
  new Tenant(
    TenantId.create('corp-umbrella'),
    'Umbrella Health',
    'FREE',
    new Date('2026-10-01T08:00:00Z')
  ),
];

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data: rawTenants = [], isLoading, isError } = useTenantsList();
  const [activeTenant, setActiveTenantState] = useState<Tenant | null>(null);
  const [pendingTenant, setPendingTenant] = useState<Tenant | null>(null);
  const [isSwitchGuardOpen, setIsSwitchGuardOpen] = useState(false);

  // If rawTenants is empty or failed, gracefully use fallback seed tenants
  const tenants = useMemo(() => {
    if (rawTenants.length > 0) return rawTenants;
    if (!isLoading || isError) return DEFAULT_FALLBACK_TENANTS;
    return [];
  }, [rawTenants, isLoading, isError]);

  // Initialize or restore active tenant once tenants list is available
  useEffect(() => {
    if (tenants.length === 0) return;

    if (!activeTenant) {
      const storedId = tenantSessionStore.getActiveTenantId();
      const matched = storedId ? tenants.find((t) => t.id.equals(storedId)) : null;
      const initial = matched ?? tenants[0];
      setActiveTenantState(initial);
      tenantSessionStore.setActiveTenantId(initial.id);
    }
  }, [tenants, activeTenant]);

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
        isLoading: isLoading && tenants.length === 0,
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
