import { describe, it, expect, beforeEach } from 'vitest';
import { MockTenantGateway } from './MockTenantGateway';

describe('MockTenantGateway', () => {
  let gateway: MockTenantGateway;

  beforeEach(() => {
    gateway = new MockTenantGateway();
  });

  it('returns predefined mock tenants (Acme Corp, Globex Industries)', async () => {
    const tenants = await gateway.getTenants();
    expect(tenants.length).toBeGreaterThanOrEqual(2);
    expect(tenants.some((t) => t.id.value === 'corp-acme')).toBe(true);
    expect(tenants.some((t) => t.id.value === 'corp-globex')).toBe(true);
  });

  it('creates and appends a new tenant in memory', async () => {
    const created = await gateway.createTenant({
      id: 'corp-initech',
      name: 'Initech Systems',
      tier: 'ENTERPRISE',
    });

    expect(created.id.value).toBe('corp-initech');
    expect(created.name).toBe('Initech Systems');

    const all = await gateway.getTenants();
    expect(all.some((t) => t.id.value === 'corp-initech')).toBe(true);
  });
});
