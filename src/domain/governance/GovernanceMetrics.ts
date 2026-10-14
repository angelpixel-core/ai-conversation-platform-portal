export interface GovernanceMetricsProps {
  totalIncidents: number;
  blockedJailbreaks: number;
  piiRedactedCount: number;
  averageRiskScore: number;
  inspectionLatencyP99Ms: number;
}

export class GovernanceMetrics {
  public readonly totalIncidents: number;
  public readonly blockedJailbreaks: number;
  public readonly piiRedactedCount: number;
  public readonly averageRiskScore: number;
  public readonly inspectionLatencyP99Ms: number;

  constructor(props: GovernanceMetricsProps) {
    this.totalIncidents = Math.max(0, props.totalIncidents);
    this.blockedJailbreaks = Math.max(0, props.blockedJailbreaks);
    this.piiRedactedCount = Math.max(0, props.piiRedactedCount);
    this.averageRiskScore = Math.max(0, Math.min(1, props.averageRiskScore));
    this.inspectionLatencyP99Ms = Math.max(0, props.inspectionLatencyP99Ms);
  }

  get formattedAverageRisk(): string {
    return `${Math.round(this.averageRiskScore * 100)}%`;
  }

  get formattedLatency(): string {
    return `${this.inspectionLatencyP99Ms.toFixed(1)}ms`;
  }

  get mitigationRate(): number {
    if (this.totalIncidents === 0) return 100;
    const mitigated = this.blockedJailbreaks + this.piiRedactedCount;
    return Math.min(100, Math.round((mitigated / this.totalIncidents) * 100));
  }
}
