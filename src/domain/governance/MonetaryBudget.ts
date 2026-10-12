export interface MonetaryBudgetProps {
  tenantId: string;
  balance: number;
  reservedAmount: number;
  availableBalance: number;
  currency?: string;
}

export class MonetaryBudget {
  public readonly tenantId: string;
  public readonly balance: number;
  public readonly reservedAmount: number;
  public readonly availableBalance: number;
  public readonly currency: string;

  constructor(props: MonetaryBudgetProps) {
    if (!props.tenantId || props.tenantId.trim() === '') {
      throw new Error('Tenant ID cannot be empty');
    }
    this.tenantId = props.tenantId;
    this.balance = Math.max(0, props.balance);
    this.reservedAmount = Math.max(0, props.reservedAmount);
    this.availableBalance = Math.max(0, props.availableBalance);
    this.currency = props.currency || 'USD';
  }

  get usagePercentage(): number {
    if (this.balance <= 0) return 100;
    const reservedRatio = (this.reservedAmount / this.balance) * 100;
    return Math.min(100, Math.max(0, Math.round(reservedRatio)));
  }

  get isLowBudget(): boolean {
    return this.availableBalance > 0 && this.availableBalance < this.balance * 0.15;
  }

  get isExhausted(): boolean {
    return this.availableBalance <= 0;
  }

  static fromRaw(raw: {
    tenant_id?: string;
    tenantId?: string;
    balance: string | number;
    reserved_amount?: string | number;
    reservedAmount?: string | number;
    available_balance?: string | number;
    availableBalance?: string | number;
    currency?: string;
  }): MonetaryBudget {
    const parseNum = (val: string | number | undefined, defaultVal = 0): number => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? defaultVal : parsed;
      }
      return defaultVal;
    };

    return new MonetaryBudget({
      tenantId: raw.tenant_id || raw.tenantId || 'unknown-tenant',
      balance: parseNum(raw.balance),
      reservedAmount: parseNum(raw.reserved_amount ?? raw.reservedAmount),
      availableBalance: parseNum(raw.available_balance ?? raw.availableBalance),
      currency: raw.currency || 'USD',
    });
  }
}
