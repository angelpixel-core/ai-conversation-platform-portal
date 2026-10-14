import { IncidentSeverity } from './IncidentSeverity';
import { ViolationType } from './ViolationType';

export interface SecurityIncidentProps {
  id: string;
  tenantId: string;
  violationType: ViolationType;
  severity: IncidentSeverity;
  riskScore: number;
  detectedPattern: string;
  redactedSnippet: string;
  traceId: string;
  spanId?: string;
  createdAt: Date;
}

export class SecurityIncident {
  public readonly id: string;
  public readonly tenantId: string;
  public readonly violationType: ViolationType;
  public readonly severity: IncidentSeverity;
  public readonly riskScore: number;
  public readonly detectedPattern: string;
  public readonly redactedSnippet: string;
  public readonly traceId: string;
  public readonly spanId: string;
  public readonly createdAt: Date;

  constructor(props: SecurityIncidentProps) {
    if (!props.id || props.id.trim() === '') {
      throw new Error('El ID de incidente no puede estar vacío');
    }
    if (!props.tenantId || props.tenantId.trim() === '') {
      throw new Error('El tenant ID no puede estar vacío');
    }
    if (props.riskScore < 0 || props.riskScore > 1) {
      throw new Error('El risk score debe estar entre 0.0 y 1.0');
    }

    this.id = props.id;
    this.tenantId = props.tenantId;
    this.violationType = props.violationType;
    this.severity = props.severity;
    this.riskScore = props.riskScore;
    this.detectedPattern = props.detectedPattern;
    this.redactedSnippet = props.redactedSnippet;
    this.traceId = props.traceId;
    this.spanId = props.spanId || '00f067aa0ba902b7';
    this.createdAt = props.createdAt;
  }

  get formattedRisk(): string {
    return `${Math.round(this.riskScore * 100)}%`;
  }

  get severityColor(): string {
    switch (this.severity) {
      case 'CRITICAL':
        return '#EF4444';
      case 'HIGH':
        return '#F97316';
      case 'MEDIUM':
        return '#F59E0B';
      case 'LOW':
      default:
        return '#3B82F6';
    }
  }

  get severityBadgeClass(): string {
    switch (this.severity) {
      case 'CRITICAL':
        return 'bg-red-500 text-white';
      case 'HIGH':
        return 'bg-orange-500 text-white';
      case 'MEDIUM':
        return 'bg-amber-400 text-black';
      case 'LOW':
      default:
        return 'bg-sky-400 text-black';
    }
  }

  get isCritical(): boolean {
    return this.severity === 'CRITICAL';
  }
}
