import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch } from './apiClient';
import { tenantSessionStore } from '../storage/tenantSessionStore';
import { TenantId } from '@/domain/tenants/TenantId';

describe('apiClient', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    tenantSessionStore.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('automatically attaches X-Tenant-Id header when active tenant is stored in session', async () => {
    tenantSessionStore.setActiveTenantId(TenantId.create('corp-acme'));

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    } as Response);
    global.fetch = mockFetch;

    await apiFetch('/some/endpoint');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, options] = mockFetch.mock.calls[0];
    const headers = options.headers as Headers;
    expect(headers.get('X-Tenant-Id')).toBe('corp-acme');
  });

  it('omits X-Tenant-Id header when no active tenant is stored in session', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    } as Response);
    global.fetch = mockFetch;

    await apiFetch('/health');

    const [, options] = mockFetch.mock.calls[0];
    const headers = options.headers as Headers;
    expect(headers.get('X-Tenant-Id')).toBeNull();
  });
});
