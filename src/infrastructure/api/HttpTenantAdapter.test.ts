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

  it('tolerantly parses live FastAPI backend response using tenant_id, STANDARD tier, and financial balances', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [
        {
          tenant_id: 'corp-acme',
          name: 'ACME Corporation',
          status: 'ACTIVE',
          tier: 'STANDARD',
          balance: '1000.0000',
          reserved_amount: '0.0000',
          available_balance: '1000.0000',
          currency: 'USD',
        },
        {
          tenant_id: 'default-tenant',
          name: 'Default System Tenant',
          status: 'ACTIVE',
          tier: 'STANDARD',
          balance: '1000.0000',
          reserved_amount: '0.0000',
          available_balance: '1000.0000',
          currency: 'USD',
        },
      ],
    } as Response);

    const adapter = new HttpTenantAdapter('http://localhost:8000');
    const tenants = await adapter.getTenants();

    expect(tenants).toHaveLength(2);
    expect(tenants[0].id.value).toBe('corp-acme');
    expect(tenants[0].name).toBe('ACME Corporation');
    expect(tenants[0].tier).toBe('STANDARD');
    expect(tenants[0].isStandard).toBe(true);
    expect(tenants[0].balance).toBe('1000.0000');
    expect(tenants[0].formattedBalance).toBe('$1,000.00 USD');
    expect(tenants[0].status).toBe('ACTIVE');
  });

  it('provisions a new tenant with POST /admin/tenants and sends dual-schema payload', async () => {
    let capturedBody: any = null;
    global.fetch = vi.fn().mockImplementation((_url, init) => {
      capturedBody = JSON.parse(init.body);
      return Promise.resolve({
        ok: true,
        status: 201,
        json: async () => ({
          tenant_id: 'corp-initech',
          name: 'Initech Systems',
          tier: 'ENTERPRISE',
          balance: '1500.0000',
          currency: 'USD',
        }),
      } as Response);
    });

    const adapter = new HttpTenantAdapter('http://localhost:8000');
    const created = await adapter.createTenant({
      id: 'corp-initech',
      name: 'Initech Systems',
      tier: 'ENTERPRISE',
      balanceUsd: '1500.00',
    });

    expect(capturedBody.id).toBe('corp-initech');
    expect(capturedBody.tenant_id).toBe('corp-initech');
    expect(capturedBody.balance_usd).toBe('1500.00');
    expect(created.id.value).toBe('corp-initech');
    expect(created.name).toBe('Initech Systems');
    expect(created.tier).toBe('ENTERPRISE');
    expect(created.balance).toBe('1500.0000');
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
