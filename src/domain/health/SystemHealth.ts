export type HealthStatusLevel = 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'CHECKING';

export interface ComponentHealthCheck {
  name: string;
  status: HealthStatusLevel;
  latencyMs?: number;
  database?: string;
  message?: string;
}

export class SystemHealth {
  constructor(
    public readonly status: HealthStatusLevel,
    public readonly latencyMs: number,
    public readonly checkedAt: Date,
    public readonly components: ComponentHealthCheck[] = []
  ) {}

  get isOperational(): boolean {
    return this.status === 'HEALTHY' || this.status === 'DEGRADED';
  }

  get statusColor(): string {
    switch (this.status) {
      case 'HEALTHY':
        return '#10B981'; // Emerald 500
      case 'DEGRADED':
        return '#F59E0B'; // Amber 500
      case 'DOWN':
        return '#EF4444'; // Red 500
      case 'CHECKING':
      default:
        return '#64748B'; // Slate 500
    }
  }

  getComponentCheck(name: string): ComponentHealthCheck | undefined {
    return this.components.find((comp) => comp.name.toLowerCase() === name.toLowerCase());
  }
}
