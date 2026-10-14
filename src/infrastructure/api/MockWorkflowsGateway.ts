import { WorkflowsGateway, StartWorkflowParams, ResumeWorkflowParams } from '@/domain/workflows/WorkflowsGateway';
import { WorkflowAggregate } from '@/domain/workflows/WorkflowAggregate';
import { WorkflowCheckpoint } from '@/domain/workflows/WorkflowCheckpoint';

export class MockWorkflowsGateway implements WorkflowsGateway {
  private activeWorkflows: Map<string, WorkflowAggregate> = new Map();

  constructor() {
    // Pre-populate with a demo workflow if needed
    const defaultWf = WorkflowAggregate.createNew('wf-demo-1', 'corp-acme', 'research_and_audit_pipeline')
      .start({ query: 'Auditar políticas de seguridad corporativas y resumir factores de riesgo.' })
      .handoff('supervisor', 'researcher', 'Búsqueda de normativas y antecedentes', {
        articles_indexed: 14,
        vector_similarity_top_score: 0.94,
      })
      .handoff('researcher', 'auditor', 'Hallazgos de riesgo elevado detectados', {
        risk_flags: ['UNENCRYPTED_PII_EXPORT', 'OVER_PRIVILEGED_ACCESS'],
        requires_human_signoff: true,
      })
      .pauseForApproval('auditor', 'Pausa por compliance: Requiere autorización humana para sintetizar informe', {
        risk_flags: ['UNENCRYPTED_PII_EXPORT', 'OVER_PRIVILEGED_ACCESS'],
        approval_gate: 'CISO_OR_SECOPS',
      });

    this.activeWorkflows.set('wf-demo-1', defaultWf);
  }

  async startWorkflow(params: StartWorkflowParams): Promise<WorkflowAggregate> {
    const id = `wf-${Date.now().toString(36)}`;
    const wf = WorkflowAggregate.createNew(id, params.tenantId, params.graphName || 'research_and_audit_pipeline');
    const started = wf.start(params.initialContext || { query: 'Investigación iniciada' });
    this.activeWorkflows.set(id, started);
    return started;
  }

  async getWorkflow(tenantId: string, workflowId: string): Promise<WorkflowAggregate> {
    const wf = this.activeWorkflows.get(workflowId);
    if (!wf) {
      throw new Error(`Workflow with ID ${workflowId} not found`);
    }
    return wf;
  }

  async getCheckpoints(tenantId: string, workflowId: string): Promise<WorkflowCheckpoint[]> {
    const wf = await this.getWorkflow(tenantId, workflowId);
    return [...wf.checkpoints];
  }

  async resumeWorkflow(params: ResumeWorkflowParams): Promise<WorkflowAggregate> {
    const wf = await this.getWorkflow(params.tenantId, params.workflowId);
    
    // Resumes by injecting override into auditor and transitioning to synthesizer
    const resumed = wf.resumeWithOverride(params.nodeId, params.overrideContext);
    
    // Auto-complete synthesizer in mock after successful resumption
    const completed = resumed.finishWorkflow(
      'Informe ejecutivo sintetizado tras aprobación exitosa por el operador de seguridad'
    );

    this.activeWorkflows.set(params.workflowId, completed);
    return completed;
  }

  // Helper for tests and demos to advance steps manually
  advanceToResearcher(workflowId: string): WorkflowAggregate {
    const wf = this.activeWorkflows.get(workflowId);
    if (!wf) throw new Error('Workflow not found');
    const updated = wf.handoff('supervisor', 'researcher', 'Investigación delegada', {
      findings_count: 5,
    });
    this.activeWorkflows.set(workflowId, updated);
    return updated;
  }

  advanceToAuditorAndPause(workflowId: string): WorkflowAggregate {
    const wf = this.activeWorkflows.get(workflowId);
    if (!wf) throw new Error('Workflow not found');
    const updated = wf
      .handoff('researcher', 'auditor', 'Auditoría de riesgos', { risk_level: 'HIGH' })
      .pauseForApproval('auditor', 'Requiere intervención humana para continuar', { risk_level: 'HIGH' });
    this.activeWorkflows.set(workflowId, updated);
    return updated;
  }
}
