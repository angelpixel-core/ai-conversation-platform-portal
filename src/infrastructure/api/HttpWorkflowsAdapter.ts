import { WorkflowsGateway, StartWorkflowParams, ResumeWorkflowParams } from '@/domain/workflows/WorkflowsGateway';
import { WorkflowAggregate, WorkflowStatus, createDefaultWorkflowNodes } from '@/domain/workflows/WorkflowAggregate';
import { WorkflowCheckpoint } from '@/domain/workflows/WorkflowCheckpoint';
import { WorkflowId } from '@/domain/workflows/WorkflowId';
import { WorkflowNode } from '@/domain/workflows/WorkflowNode';
import { NodeStatus } from '@/domain/workflows/NodeStatus';
import { AgentRole } from '@/domain/workflows/AgentRole';
import { apiFetch } from './apiClient';
import { MockWorkflowsGateway } from './MockWorkflowsGateway';

interface RawCheckpointDto {
  checkpoint_id?: string;
  id?: string;
  version?: number;
  node?: string;
  state_snapshot?: Record<string, unknown>;
  created_at?: string;
}

interface RawWorkflowDto {
  workflow_id?: string;
  id?: string;
  graph_name?: string;
  status?: string;
  active_node_id?: string;
  nodes?: Array<{
    id: string;
    name?: string;
    role?: string;
    status?: string;
    description?: string;
    output_summary?: string;
  }>;
  checkpoints?: RawCheckpointDto[];
}

export class HttpWorkflowsAdapter implements WorkflowsGateway {
  private fallbackMock = new MockWorkflowsGateway();

  private mapCheckpoint(dto: RawCheckpointDto, index: number): WorkflowCheckpoint {
    return new WorkflowCheckpoint({
      id: dto.checkpoint_id || dto.id || `chk-${index + 1}`,
      version: dto.version ?? index + 1,
      node: dto.node || 'supervisor',
      stateSnapshot: dto.state_snapshot || {},
      createdAt: dto.created_at ? new Date(dto.created_at) : new Date(),
    });
  }

  private mapDtoToAggregate(dto: RawWorkflowDto, tenantId: string): WorkflowAggregate {
    const id = new WorkflowId(dto.workflow_id || dto.id || `wf-${Date.now()}`);
    const graphName = dto.graph_name || 'research_and_audit_pipeline';
    const status = (dto.status?.toUpperCase() || 'IDLE') as WorkflowStatus;
    const activeNodeId = dto.active_node_id || null;

    const nodes = dto.nodes
      ? dto.nodes.map(
          (n) =>
            new WorkflowNode({
              id: n.id,
              name: n.name,
              role: (n.role || 'supervisor') as AgentRole,
              status: (n.status || 'IDLE') as NodeStatus,
              description: n.description || '',
              outputSummary: n.output_summary,
            })
        )
      : createDefaultWorkflowNodes();

    const checkpoints = (dto.checkpoints || []).map((c, idx) => this.mapCheckpoint(c, idx));

    return new WorkflowAggregate({
      id,
      tenantId,
      graphName,
      status,
      activeNodeId,
      nodes,
      checkpoints,
    });
  }

  async startWorkflow(params: StartWorkflowParams): Promise<WorkflowAggregate> {
    try {
      const data = await apiFetch<RawWorkflowDto>(
        `/tenants/${encodeURIComponent(params.tenantId)}/workflows`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-Id': params.tenantId,
          },
          body: JSON.stringify({
            graph_name: params.graphName || 'research_and_audit_pipeline',
            initial_context: params.initialContext || {},
          }),
        }
      );
      return this.mapDtoToAggregate(data, params.tenantId);
    } catch {
      return this.fallbackMock.startWorkflow(params);
    }
  }

  async getWorkflow(tenantId: string, workflowId: string): Promise<WorkflowAggregate> {
    try {
      const data = await apiFetch<RawWorkflowDto>(
        `/tenants/${encodeURIComponent(tenantId)}/workflows/${encodeURIComponent(workflowId)}`,
        {
          headers: {
            'X-Tenant-Id': tenantId,
          },
        }
      );
      return this.mapDtoToAggregate(data, tenantId);
    } catch {
      return this.fallbackMock.getWorkflow(tenantId, workflowId);
    }
  }

  async getCheckpoints(tenantId: string, workflowId: string): Promise<WorkflowCheckpoint[]> {
    try {
      const data = await apiFetch<RawCheckpointDto[]>(
        `/tenants/${encodeURIComponent(tenantId)}/workflows/${encodeURIComponent(workflowId)}/checkpoints`,
        {
          headers: {
            'X-Tenant-Id': tenantId,
          },
        }
      );
      return data.map((c, idx) => this.mapCheckpoint(c, idx));
    } catch {
      return this.fallbackMock.getCheckpoints(tenantId, workflowId);
    }
  }

  async resumeWorkflow(params: ResumeWorkflowParams): Promise<WorkflowAggregate> {
    try {
      const data = await apiFetch<RawWorkflowDto>(
        `/tenants/${encodeURIComponent(params.tenantId)}/workflows/${encodeURIComponent(params.workflowId)}/resume`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-Id': params.tenantId,
          },
          body: JSON.stringify({
            node_id: params.nodeId,
            updated_context: params.overrideContext,
          }),
        }
      );
      return this.mapDtoToAggregate(data, params.tenantId);
    } catch {
      return this.fallbackMock.resumeWorkflow(params);
    }
  }
}
