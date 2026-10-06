import { describe, it, expect } from 'vitest';
import { TenantId } from './TenantId';

describe('TenantId Value Object', () => {
  it('creates valid TenantId from lowercase alphanumeric hyphenated slug', () => {
    const tenantId = TenantId.create('corp-acme');
    expect(tenantId.value).toBe('corp-acme');
  });

  it('normalizes uppercase strings and trims whitespace', () => {
    const tenantId = TenantId.create('  CORP-GLOBEX  ');
    expect(tenantId.value).toBe('corp-globex');
  });

  it('throws error for invalid characters like spaces, symbols, or underscore', () => {
    expect(() => TenantId.create('invalid_tenant')).toThrow();
    expect(() => TenantId.create('tenant with space')).toThrow();
    expect(() => TenantId.create('corp@acme')).toThrow();
    expect(() => TenantId.create('')).toThrow();
  });

  it('correctly compares equality with another TenantId instance', () => {
    const id1 = TenantId.create('corp-acme');
    const id2 = TenantId.create('corp-acme');
    const id3 = TenantId.create('corp-globex');

    expect(id1.equals(id2)).toBe(true);
    expect(id1.equals(id3)).toBe(false);
  });
});
