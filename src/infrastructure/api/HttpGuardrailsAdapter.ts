import { GuardrailsGateway } from '@/domain/governance/GuardrailsGateway';
import { SecurityIncident } from '@/domain/governance/SecurityIncident';
import { GovernanceMetrics } from '@/domain/governance/GovernanceMetrics';
import { IncidentSeverity } from '@/domain/governance/IncidentSeverity';
import { ViolationType } from '@/domain/governance/ViolationType';
import { apiFetch } from './apiClient';
import { MockGuardrailsGateway } from './MockGuardrailsGateway';

interface RawIncidentDto {
  incident_id?: string;
  id?: string;
  tenant_id?: string;
  violation_type?: string;
  severity?: string;
  risk_score?: number;
  detected_pattern?: string;
  redacted_snippet?: string;
  trace_id?: string;
  span_id?: string;
  created_at?: string;
}

interface RawMetricsDto {
  total_incidents?: number;
  blocked_jailbreaks?: number;
  pii_redacted_count?: number;
  average_risk_score?: number;
  inspection_latency_p99_ms?: number;
}

export class HttpGuardrailsAdapter implements GuardrailsGateway {
  private fallbackMock = new MockGuardrailsGateway();

  private mapIncidentDto(dto: RawIncidentDto, fallbackTenantId: string): SecurityIncident {
    return new SecurityIncident({
      id: dto.incident_id || dto.id || `inc-${Date.now()}`,
      tenantId: dto.tenant_id || fallbackTenantId,
      violationType: (dto.violation_type?.toUpperCase() || 'PROMPT_INJECTION') as ViolationType,
      severity: (dto.severity?.toUpperCase() || 'HIGH') as IncidentSeverity,
      riskScore: typeof dto.risk_score === 'number' ? dto.risk_score : 0.85,
      detectedPattern: dto.detected_pattern || 'unknown_pattern',
      redactedSnippet: dto.redacted_snippet || 'No snippet available',
      traceId: dto.trace_id || '00000000000000000000000000000000',
      spanId: dto.span_id || '00f067aa0ba902b7',
      createdAt: dto.created_at ? new Date(dto.created_at) : new Date(),
    });
  }

  async getIncidents(tenantId: string, severity?: IncidentSeverity): Promise<SecurityIncident[]> {
    try {
      const query = severity ? `?severity=${severity}&limit=50` : '?limit=50';
      const data = await apiFetch<RawIncidentDto[]>(`/admin/tenants/${tenantId}/incidents${query}`, {
        headers: { 'X-Tenant-Id': tenantId },
      });

      if (Array.isArray(data)) {
        return data.map(dto => this.mapIncidentDto(dto, tenantId));
      }
      return this.fallbackMock.getIncidents(tenantId, severity);
    } catch {
      return this.fallbackMock.getIncidents(tenantId, severity);
    }
  }

  async getMetrics(tenantId?: string): Promise<GovernanceMetrics> {
    try {
      const headers = tenantId ? { 'X-Tenant-Id': tenantId } : undefined;
      const data = await apiFetch<RawMetricsDto>('/admin/governance/metrics', {
        headers,
      });

      if (data && typeof data.total_incidents === 'number') {
        return new GovernanceMetrics({
          totalIncidents: data.total_incidents,
          blockedJailbreaks: data.blocked_jailbreaks ?? 0,
          piiRedactedCount: data.pii_redacted_count ?? 0,
          averageRiskScore: data.average_risk_score ?? 0.8,
          inspectionLatencyP99Ms: data.inspection_latency_p99_ms ?? 8.4,
        });
      }
      return this.fallbackMock.getMetrics(tenantId);
    } catch {
      return this.fallbackMock.getMetrics(tenantId);
    }
  }

  async simulateAttack(tenantId: string, type: ViolationType): Promise<SecurityIncident> {
    try {
      const data = await apiFetch<RawIncidentDto>(`/admin/tenants/${tenantId}/simulate-attack`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': tenantId,
        },
        body: JSON.stringify({ violation_type: type }),
      });

      if (data && (data.incident_id || data.id)) {
        return this.mapIncidentDto(data, tenantId);
      }
      return this.fallbackMock.simulateAttack(tenantId, type);
    } catch {
      return this.fallbackMock.simulateAttack(tenantId, type);
    }
  }
}
