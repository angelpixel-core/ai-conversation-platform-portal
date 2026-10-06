import { TenantId } from './TenantId';
import { TenantTier } from './TenantTier';

export class Tenant {
  constructor(
    public readonly id: TenantId,
    public readonly name: string,
    public readonly tier: TenantTier = 'PRO',
    public readonly createdAt: Date = new Date()
  ) {}

  get isEnterprise(): boolean {
    return this.tier === 'ENTERPRISE';
  }

  get initials(): string {
    const parts = this.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return this.name.slice(0, 2).toUpperCase();
  }
}
