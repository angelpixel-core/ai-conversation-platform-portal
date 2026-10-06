import { describe, it, expect, beforeEach } from 'vitest';
import { tenantSessionStore } from './tenantSessionStore';
import { TenantId } from '@/domain/tenants/TenantId';

describe('tenantSessionStore', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('returns null when no tenant is stored', () => {
    expect(tenantSessionStore.getActiveTenantId()).toBeNull();
  });

  it('saves and retrieves active tenant id', () => {
    const id = TenantId.create('corp-acme');
    tenantSessionStore.setActiveTenantId(id);

    const retrieved = tenantSessionStore.getActiveTenantId();
    expect(retrieved).not.toBeNull();
    expect(retrieved?.value).toBe('corp-acme');
  });

  it('clears active tenant id', () => {
    tenantSessionStore.setActiveTenantId(TenantId.create('corp-globex'));
    expect(tenantSessionStore.getActiveTenantId()?.value).toBe('corp-globex');

    tenantSessionStore.clear();
    expect(tenantSessionStore.getActiveTenantId()).toBeNull();
  });
});
