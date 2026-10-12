import { TenantId } from '@/domain/tenants/TenantId';

const STORAGE_KEY = 'convo_active_tenant_id';

export const tenantSessionStore = {
  getActiveTenantId(): TenantId | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      return TenantId.create(stored);
    } catch {
      return null;
    }
  },

  setActiveTenantId(id: TenantId): void {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(STORAGE_KEY, id.value);
    } catch {
      // Ignore storage errors in restricted contexts
    }
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  },
};
