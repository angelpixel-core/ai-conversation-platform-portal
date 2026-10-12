import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpTenantAdapter } from './HttpTenantAdapter';

describe('HttpTenantAdapter', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetches tenants list from GET /admin/tenants and maps to Tenant domain entities', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [
        { id: 'corp-acme', name: 'Acme Corporation', tier: 'ENTERPRISE', created_at: '2026-09-20T10:00:00Z' },
        { id: 'corp-globex', name: 'Globex Industries', tier: 'PRO', created_at: '2026-09-22T14:30:00Z' },
      ],
    } as Response);

    const adapter = new HttpTenantAdapter('http://localhost:8000');
    const tenants = await adapter.getTenants();

    expect(tenants).toHaveLength(2);
    expect(tenants[0].id.value).toBe('corp-acme');
    expect(tenants[0].tier).toBe('ENTERPRISE');
    expect(tenants[1].id.value).toBe('corp-globex');
  });

  it('provisions a new tenant with POST /admin/tenants', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: 'corp-initech',
        name: 'Initech Systems',
        tier: 'ENTERPRISE',
        created_at: '2026-10-06T12:00:00Z',
      }),
    } as Response);

    const adapter = new HttpTenantAdapter('http://localhost:8000');
    const created = await adapter.createTenant({
      id: 'corp-initech',
      name: 'Initech Systems',
      tier: 'ENTERPRISE',
      initialBudgetUsd: '1500.00',
    });

    expect(created.id.value).toBe('corp-initech');
    expect(created.name).toBe('Initech Systems');
    expect(created.tier).toBe('ENTERPRISE');
  });

  it('throws helpful error when backend returns failure status', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    const adapter = new HttpTenantAdapter('http://localhost:8000');
    await expect(adapter.getTenants()).rejects.toThrow('Error fetching tenants: HTTP 500');
  });
});
