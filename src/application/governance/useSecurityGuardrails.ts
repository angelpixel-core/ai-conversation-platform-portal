import { useState, useEffect, useCallback } from 'react';
import { GuardrailsGateway } from '@/domain/governance/GuardrailsGateway';
import { SecurityIncident } from '@/domain/governance/SecurityIncident';
import { GovernanceMetrics } from '@/domain/governance/GovernanceMetrics';
import { IncidentSeverity } from '@/domain/governance/IncidentSeverity';
import { ViolationType } from '@/domain/governance/ViolationType';
import { MockGuardrailsGateway } from '@/infrastructure/api/MockGuardrailsGateway';
import { HttpGuardrailsAdapter } from '@/infrastructure/api/HttpGuardrailsAdapter';
import { useTenant } from '@/application/tenants/TenantContext';

export interface UseSecurityGuardrailsOptions {
  tenantId?: string;
  gateway?: GuardrailsGateway;
}

const defaultGateway: GuardrailsGateway =
  process.env.NEXT_PUBLIC_USE_MOCKS !== 'false'
    ? new MockGuardrailsGateway()
    : new HttpGuardrailsAdapter();

export function useSecurityGuardrails(options: UseSecurityGuardrailsOptions = {}) {
  let sessionTenantId = 'corp-acme';
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const tenantCtx = useTenant();
    if (tenantCtx?.activeTenant?.id.value) {
      sessionTenantId = tenantCtx.activeTenant.id.value;
    }
  } catch {
    // Rendered outside TenantProvider
  }

  const tenantId = options.tenantId || sessionTenantId;
  const gateway = options.gateway || defaultGateway;

  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [metrics, setMetrics] = useState<GovernanceMetrics | null>(null);
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | 'ALL'>('ALL');
  const [selectedTraceIncident, setSelectedTraceIncident] = useState<SecurityIncident | null>(null);
  const [activeAlert, setActiveAlert] = useState<SecurityIncident | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const sev = severityFilter === 'ALL' ? undefined : severityFilter;
      const [fetchedIncidents, fetchedMetrics] = await Promise.all([
        gateway.getIncidents(tenantId, sev),
        gateway.getMetrics(tenantId),
      ]);
      setIncidents(fetchedIncidents);
      setMetrics(fetchedMetrics);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar gobernanza y guardrails';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [gateway, tenantId, severityFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const simulateAttack = useCallback(
    async (type: ViolationType) => {
      try {
        setIsSimulating(true);
        setError(null);
        const incident = await gateway.simulateAttack(tenantId, type);
        setActiveAlert(incident);
        // Reload list and metrics
        await loadData();
        return incident;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al simular ataque';
        setError(msg);
        throw err;
      } finally {
        setIsSimulating(false);
      }
    },
    [gateway, tenantId, loadData]
  );

  const dismissAlert = useCallback(() => {
    setActiveAlert(null);
  }, []);

  const selectTrace = useCallback((incident: SecurityIncident | null) => {
    setSelectedTraceIncident(incident);
  }, []);

  return {
    tenantId,
    incidents,
    metrics,
    severityFilter,
    setSeverityFilter,
    selectedTraceIncident,
    selectTrace,
    activeAlert,
    dismissAlert,
    isLoading,
    isSimulating,
    error,
    refreshData: loadData,
    simulateAttack,
  };
}
