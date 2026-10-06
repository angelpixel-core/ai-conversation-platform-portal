import { describe, it, expect } from 'vitest';
import { Tenant } from './Tenant';
import { TenantId } from './TenantId';

describe('Tenant Entity', () => {
  it('instantiates Tenant entity with id, name, tier, and creation date', () => {
    const id = TenantId.create('corp-acme');
    const createdAt = new Date('2026-09-20T10:00:00Z');
    const tenant = new Tenant(id, 'Acme Corporation', 'ENTERPRISE', createdAt);

    expect(tenant.id.value).toBe('corp-acme');
    expect(tenant.name).toBe('Acme Corporation');
    expect(tenant.tier).toBe('ENTERPRISE');
    expect(tenant.initials).toBe('AC');
  });

  it('computes correct initials for multi-word and single-word names', () => {
    const t1 = new Tenant(TenantId.create('corp-acme'), 'Acme Corporation', 'PRO');
    const t2 = new Tenant(TenantId.create('initech'), 'Initech', 'FREE');

    expect(t1.initials).toBe('AC');
    expect(t2.initials).toBe('IN');
  });

  it('determines whether tenant has enterprise privileges', () => {
    const tEnt = new Tenant(TenantId.create('corp-acme'), 'Acme', 'ENTERPRISE');
    const tPro = new Tenant(TenantId.create('corp-globex'), 'Globex', 'PRO');
    const tFree = new Tenant(TenantId.create('corp-free'), 'FreeCorp', 'FREE');

    expect(tEnt.isEnterprise).toBe(true);
    expect(tPro.isEnterprise).toBe(false);
    expect(tFree.isEnterprise).toBe(false);
  });
});
