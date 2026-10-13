import { useState, useEffect, useCallback } from 'react';
import { WorkflowsGateway } from '@/domain/workflows/WorkflowsGateway';
import { WorkflowAggregate } from '@/domain/workflows/WorkflowAggregate';
import { WorkflowCheckpoint } from '@/domain/workflows/WorkflowCheckpoint';
import { MockWorkflowsGateway } from '@/infrastructure/api/MockWorkflowsGateway';
import { HttpWorkflowsAdapter } from '@/infrastructure/api/HttpWorkflowsAdapter';
import { useTenant } from '@/application/tenants/TenantContext';

export interface UseWorkflowOrchestratorOptions {
  tenantId?: string;
  gateway?: WorkflowsGateway;
  initialWorkflowId?: string;
}

const defaultGateway: WorkflowsGateway =
  process.env.NEXT_PUBLIC_USE_MOCKS !== 'false'
    ? new MockWorkflowsGateway()
    : new HttpWorkflowsAdapter();

export function useWorkflowOrchestrator(options: UseWorkflowOrchestratorOptions = {}) {
  let sessionTenantId = 'corp-acme';
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const tenantCtx = useTenant();
    if (tenantCtx?.activeTenant?.id.value) {
      sessionTenantId = tenantCtx.activeTenant.id.value;
    }
  } catch {
    // Fallback if rendered outside TenantProvider
  }

  const tenantId = options.tenantId || sessionTenantId;
  const gateway = options.gateway || defaultGateway;
  const initialWfId = options.initialWorkflowId ?? 'wf-demo-1';

  const [workflow, setWorkflow] = useState<WorkflowAggregate | null>(null);
  const [checkpoints, setCheckpoints] = useState<WorkflowCheckpoint[]>([]);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<WorkflowCheckpoint | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [isResuming, setIsResuming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadWorkflow = useCallback(
    async (wfId: string) => {
      try {
        setIsLoading(true);
        setError(null);
        const wf = await gateway.getWorkflow(tenantId, wfId);
        setWorkflow(wf);
        const chks = await gateway.getCheckpoints(tenantId, wfId);
        setCheckpoints(chks);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al cargar el workflow';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [gateway, tenantId]
  );

  useEffect(() => {
    if (initialWfId) {
      loadWorkflow(initialWfId);
    }
  }, [initialWfId, loadWorkflow]);

  const startNewWorkflow = useCallback(
    async (query: string = 'Auditar directivas de seguridad corporativas y resumir factores de riesgo.') => {
      try {
        setIsExecuting(true);
        setError(null);
        const newWf = await gateway.startWorkflow({
          tenantId,
          graphName: 'research_and_audit_pipeline',
          initialContext: { query },
        });
        setWorkflow(newWf);
        setCheckpoints([...newWf.checkpoints]);
        return newWf;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al iniciar el workflow';
        setError(msg);
        throw err;
      } finally {
        setIsExecuting(false);
      }
    },
    [gateway, tenantId]
  );

  const advanceStep = useCallback(async () => {
    if (!workflow) return;

    if (workflow.activeNodeId === 'supervisor') {
      const updated = workflow.handoff('supervisor', 'researcher', 'Investigación delegada', {
        evidence_found: ['ISO 27001 Sec 9.2', 'SOC2 Type II Audit Log'],
        relevance_score: 0.96,
      });
      setWorkflow(updated);
      setCheckpoints([...updated.checkpoints]);
    } else if (workflow.activeNodeId === 'researcher') {
      const updated = workflow
        .handoff('researcher', 'auditor', 'Auditoría de riesgos', {
          risk_level: 'HIGH',
          flagged_issues: 2,
        })
        .pauseForApproval('auditor', 'Pausa por compliance: Requiere autorización humana para sintetizar informe', {
          risk_level: 'HIGH',
          flagged_issues: 2,
        });
      setWorkflow(updated);
      setCheckpoints([...updated.checkpoints]);
    }
  }, [workflow]);

  const resumeWorkflow = useCallback(
    async (overrideText: string) => {
      if (!workflow) return;
      try {
        setIsResuming(true);
        setError(null);
        const updated = await gateway.resumeWorkflow({
          tenantId,
          workflowId: workflow.id.value,
          nodeId: 'auditor',
          overrideContext: {
            supervisor_override: overrideText,
            approved_by: 'Operador Humano Portal',
            approved_at: new Date().toISOString(),
          },
        });
        setWorkflow(updated);
        const updatedCheckpoints = await gateway.getCheckpoints(tenantId, workflow.id.value);
        setCheckpoints(updatedCheckpoints);
        return updated;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al reanudar el workflow';
        setError(msg);
        throw err;
      } finally {
        setIsResuming(false);
      }
    },
    [gateway, tenantId, workflow]
  );

  const inspectCheckpoint = useCallback((checkpoint: WorkflowCheckpoint | null) => {
    setSelectedCheckpoint(checkpoint);
  }, []);

  const resetWorkflow = useCallback(() => {
    loadWorkflow(initialWfId);
  }, [initialWfId, loadWorkflow]);

  return {
    workflow,
    checkpoints,
    selectedCheckpoint,
    isLoading,
    isExecuting,
    isResuming,
    error,
    startNewWorkflow,
    advanceStep,
    resumeWorkflow,
    inspectCheckpoint,
    resetWorkflow,
    refresh: () => (workflow ? loadWorkflow(workflow.id.value) : Promise.resolve()),
  };
}
