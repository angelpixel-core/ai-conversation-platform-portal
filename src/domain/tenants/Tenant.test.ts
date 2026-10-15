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

  it('supports STANDARD tier, financial balances and formattedBalance helper', () => {
    const t = new Tenant(TenantId.create('corp-acme'), 'ACME Corp', 'STANDARD', new Date(), {
      status: 'ACTIVE',
      balance: '1000.0000',
      currency: 'USD',
    });

    expect(t.isStandard).toBe(true);
    expect(t.isActive).toBe(true);
    expect(t.balance).toBe('1000.0000');
    expect(t.formattedBalance).toBe('$1,000.00 USD');
  });

  it('formats tenant tier labels and returns correct Neubrutalism colors', async () => {
    const { formatTenantTier, getTenantTierColor } = await import('./TenantTier');

    expect(formatTenantTier('ENTERPRISE')).toBe('Enterprise');
    expect(formatTenantTier('STANDARD')).toBe('Standard');
    expect(formatTenantTier('PRO')).toBe('Pro');
    expect(formatTenantTier('FREE')).toBe('Free');

    const entColor = getTenantTierColor('ENTERPRISE');
    expect(entColor.bg).toContain('amber');

    const stdColor = getTenantTierColor('STANDARD');
    expect(stdColor.bg).toContain('sky');

    const freeColor = getTenantTierColor('FREE');
    expect(freeColor.bg).toContain('zinc');
  });
});
