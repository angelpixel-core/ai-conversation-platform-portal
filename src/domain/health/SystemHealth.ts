export type HealthStatusLevel = 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'CHECKING';
export type HealthMode = 'LIVE' | 'MOCK';
export type LatencyQuality = 'EXCELLENT' | 'GOOD' | 'POOR';

export interface ComponentHealthCheck {
  name: string;
  status: HealthStatusLevel;
  latencyMs?: number;
  database?: string;
  message?: string;
}

export interface SystemHealthOptions {
  mode?: HealthMode;
  rawPayload?: Record<string, unknown>;
  serverVersion?: string;
  isRFC31Compliant?: boolean;
}

export class SystemHealth {
  public readonly mode: HealthMode;
  public readonly rawPayload?: Record<string, unknown>;
  public readonly serverVersion?: string;
  public readonly isRFC31Compliant: boolean;

  constructor(
    public readonly status: HealthStatusLevel,
    public readonly latencyMs: number,
    public readonly checkedAt: Date,
    public readonly components: ComponentHealthCheck[] = [],
    options: SystemHealthOptions = {}
  ) {
    this.mode = options.mode || 'LIVE';
    this.rawPayload = options.rawPayload;
    this.serverVersion = options.serverVersion || '1.0.0';
    this.isRFC31Compliant = options.isRFC31Compliant ?? false;
  }

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

  get latencyQuality(): LatencyQuality {
    if (this.latencyMs <= 0 || this.status === 'DOWN') return 'POOR';
    if (this.latencyMs < 50) return 'EXCELLENT';
    if (this.latencyMs < 200) return 'GOOD';
    return 'POOR';
  }

  get latencyQualityColor(): string {
    switch (this.latencyQuality) {
      case 'EXCELLENT':
        return '#10B981'; // Emerald
      case 'GOOD':
        return '#F59E0B'; // Amber
      case 'POOR':
      default:
        return '#EF4444'; // Red
    }
  }

  getComponentCheck(name: string): ComponentHealthCheck | undefined {
    return this.components.find((comp) => comp.name.toLowerCase() === name.toLowerCase());
  }
}
