import { TenantId } from './TenantId';
import { TenantTier } from './TenantTier';

export interface TenantOptions {
  status?: string;
  balance?: string;
  reservedAmount?: string;
  availableBalance?: string;
  currency?: string;
  rawPayload?: Record<string, unknown>;
}

export class Tenant {
  public readonly status: string;
  public readonly balance?: string;
  public readonly reservedAmount?: string;
  public readonly availableBalance?: string;
  public readonly currency: string;
  public readonly rawPayload?: Record<string, unknown>;

  public readonly createdAt: Date;

  constructor(
    public readonly id: TenantId,
    public readonly name: string,
    public readonly tier: TenantTier = 'PRO',
    createdAtOrOptions?: Date | TenantOptions,
    options: TenantOptions = {}
  ) {
    if (createdAtOrOptions instanceof Date) {
      this.createdAt = createdAtOrOptions;
    } else if (createdAtOrOptions && typeof createdAtOrOptions === 'object') {
      this.createdAt = new Date();
      options = createdAtOrOptions;
    } else {
      this.createdAt = new Date();
    }

    this.status = options.status || 'ACTIVE';
    this.balance = options.balance;
    this.reservedAmount = options.reservedAmount;
    this.availableBalance = options.availableBalance ?? options.balance;
    this.currency = options.currency || 'USD';
    this.rawPayload = options.rawPayload;
  }

  get isEnterprise(): boolean {
    return this.tier === 'ENTERPRISE';
  }

  get isStandard(): boolean {
    return this.tier === 'STANDARD';
  }

  get isActive(): boolean {
    return this.status.toUpperCase() === 'ACTIVE';
  }

  get initials(): string {
    const parts = this.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return this.name.slice(0, 2).toUpperCase();
  }

  get formattedBalance(): string {
    const raw = this.availableBalance ?? this.balance;
    if (!raw) return 'N/A';
    const num = parseFloat(raw);
    if (isNaN(num)) return `${raw} ${this.currency}`;
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${this.currency}`;
  }
}
