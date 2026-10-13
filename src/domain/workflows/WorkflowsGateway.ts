import { WorkflowAggregate } from './WorkflowAggregate';
import { WorkflowCheckpoint } from './WorkflowCheckpoint';

export interface StartWorkflowParams {
  tenantId: string;
  graphName?: string;
  initialContext?: Record<string, unknown>;
}

export interface ResumeWorkflowParams {
  tenantId: string;
  workflowId: string;
  nodeId: string;
  overrideContext: Record<string, unknown>;
}

export interface WorkflowsGateway {
  startWorkflow(params: StartWorkflowParams): Promise<WorkflowAggregate>;
  getWorkflow(tenantId: string, workflowId: string): Promise<WorkflowAggregate>;
  getCheckpoints(tenantId: string, workflowId: string): Promise<WorkflowCheckpoint[]>;
  resumeWorkflow(params: ResumeWorkflowParams): Promise<WorkflowAggregate>;
}
