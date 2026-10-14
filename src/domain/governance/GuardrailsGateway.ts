import { SecurityIncident } from './SecurityIncident';
import { GovernanceMetrics } from './GovernanceMetrics';
import { IncidentSeverity } from './IncidentSeverity';
import { ViolationType } from './ViolationType';

export interface GuardrailsGateway {
  getIncidents(tenantId: string, severity?: IncidentSeverity): Promise<SecurityIncident[]>;
  getMetrics(tenantId?: string): Promise<GovernanceMetrics>;
  simulateAttack(tenantId: string, type: ViolationType): Promise<SecurityIncident>;
}
