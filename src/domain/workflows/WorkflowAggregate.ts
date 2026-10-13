import { WorkflowId } from './WorkflowId';
import { WorkflowNode } from './WorkflowNode';
import { WorkflowCheckpoint } from './WorkflowCheckpoint';
import { NodeStatus } from './NodeStatus';

export type WorkflowStatus = 'IDLE' | 'RUNNING' | 'PAUSED_FOR_APPROVAL' | 'COMPLETED' | 'FAILED';

export interface WorkflowAggregateProps {
  id: WorkflowId;
  tenantId: string;
  graphName: string;
  status: WorkflowStatus;
  activeNodeId: string | null;
  nodes: readonly WorkflowNode[] | WorkflowNode[];
  checkpoints: readonly WorkflowCheckpoint[] | WorkflowCheckpoint[];
  lastError?: string;
}

export function createDefaultWorkflowNodes(): WorkflowNode[] {
  return [
    new WorkflowNode({
      id: 'supervisor',
      name: 'Supervisor Orquestador',
      role: 'supervisor',
      status: 'IDLE',
      description: 'Descompone el requerimiento del usuario y asigna la investigación',
    }),
    new WorkflowNode({
      id: 'researcher',
      name: 'Investigador RAG',
      role: 'researcher',
      status: 'IDLE',
      description: 'Realiza búsqueda vectorial en la base de conocimiento y extrae citas',
    }),
    new WorkflowNode({
      id: 'auditor',
      name: 'Auditor HITL Guard',
      role: 'auditor',
      status: 'IDLE',
      description: 'Valida directivas de seguridad corporativa y solicita aprobación humana si hay riesgo',
    }),
    new WorkflowNode({
      id: 'synthesizer',
      name: 'Sintetizador Ejecutivo',
      role: 'synthesizer',
      status: 'IDLE',
      description: 'Consolida hallazgos verificados y genera la respuesta ejecutiva final',
    }),
  ];
}

export class WorkflowAggregate {
  public readonly id: WorkflowId;
  public readonly tenantId: string;
  public readonly graphName: string;
  public readonly status: WorkflowStatus;
  public readonly activeNodeId: string | null;
  public readonly nodes: readonly WorkflowNode[];
  public readonly checkpoints: readonly WorkflowCheckpoint[];
  public readonly lastError?: string;

  constructor(props: WorkflowAggregateProps) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.graphName = props.graphName;
    this.status = props.status;
    this.activeNodeId = props.activeNodeId;
    this.nodes = Object.freeze([...props.nodes]);
    this.checkpoints = Object.freeze([...props.checkpoints]);
    this.lastError = props.lastError;
  }

  static createNew(id: string, tenantId: string, graphName: string = 'research_and_audit_pipeline'): WorkflowAggregate {
    return new WorkflowAggregate({
      id: new WorkflowId(id),
      tenantId,
      graphName,
      status: 'IDLE',
      activeNodeId: null,
      nodes: createDefaultWorkflowNodes(),
      checkpoints: [],
    });
  }

  start(initialContext: Record<string, unknown> = {}): WorkflowAggregate {
    const updatedNodes = this.nodes.map((node) =>
      node.id === 'supervisor' ? node.withStatus('RUNNING') : node.withStatus('IDLE')
    );

    const initialCheckpoint = new WorkflowCheckpoint({
      id: `chk-v1`,
      version: 1,
      node: 'supervisor',
      stateSnapshot: {
        stage: 'initialized',
        ...initialContext,
      },
      createdAt: new Date(),
    });

    return new WorkflowAggregate({
      id: this.id,
      tenantId: this.tenantId,
      graphName: this.graphName,
      status: 'RUNNING',
      activeNodeId: 'supervisor',
      nodes: updatedNodes,
      checkpoints: [...this.checkpoints, initialCheckpoint],
    });
  }

  handoff(
    fromNodeId: string,
    toNodeId: string,
    summary: string,
    snapshot: Record<string, unknown>
  ): WorkflowAggregate {
    const updatedNodes = this.nodes.map((node) => {
      if (node.id === fromNodeId) {
        return node.withStatus('COMPLETED', summary);
      }
      if (node.id === toNodeId) {
        return node.withStatus('RUNNING');
      }
      return node;
    });

    const nextVersion = this.checkpoints.length + 1;
    const newCheckpoint = new WorkflowCheckpoint({
      id: `chk-v${nextVersion}`,
      version: nextVersion,
      node: toNodeId,
      stateSnapshot: snapshot,
      createdAt: new Date(),
    });

    return new WorkflowAggregate({
      id: this.id,
      tenantId: this.tenantId,
      graphName: this.graphName,
      status: 'RUNNING',
      activeNodeId: toNodeId,
      nodes: updatedNodes,
      checkpoints: [...this.checkpoints, newCheckpoint],
    });
  }

  pauseForApproval(nodeId: string, reason: string, snapshot: Record<string, unknown>): WorkflowAggregate {
    const updatedNodes = this.nodes.map((node) =>
      node.id === nodeId ? node.withStatus('PAUSED_FOR_APPROVAL', reason) : node
    );

    const nextVersion = this.checkpoints.length + 1;
    const newCheckpoint = new WorkflowCheckpoint({
      id: `chk-v${nextVersion}`,
      version: nextVersion,
      node: nodeId,
      stateSnapshot: { ...snapshot, paused_reason: reason },
      createdAt: new Date(),
    });

    return new WorkflowAggregate({
      id: this.id,
      tenantId: this.tenantId,
      graphName: this.graphName,
      status: 'PAUSED_FOR_APPROVAL',
      activeNodeId: nodeId,
      nodes: updatedNodes,
      checkpoints: [...this.checkpoints, newCheckpoint],
    });
  }

  resumeWithOverride(nodeId: string, overrideContext: Record<string, unknown>): WorkflowAggregate {
    // When resuming from auditor pause, complete auditor and transition to synthesizer
    const targetNodeId = 'synthesizer';
    const updatedNodes = this.nodes.map((node) => {
      if (node.id === nodeId) {
        return node.withStatus('COMPLETED', 'Aprobado con override por el operador');
      }
      if (node.id === targetNodeId) {
        return node.withStatus('RUNNING');
      }
      return node;
    });

    const lastSnapshot = this.checkpoints[this.checkpoints.length - 1]?.stateSnapshot || {};
    const nextVersion = this.checkpoints.length + 1;
    const newCheckpoint = new WorkflowCheckpoint({
      id: `chk-v${nextVersion}`,
      version: nextVersion,
      node: targetNodeId,
      stateSnapshot: {
        ...lastSnapshot,
        ...overrideContext,
        resumed_at: new Date().toISOString(),
      },
      createdAt: new Date(),
    });

    return new WorkflowAggregate({
      id: this.id,
      tenantId: this.tenantId,
      graphName: this.graphName,
      status: 'RUNNING',
      activeNodeId: targetNodeId,
      nodes: updatedNodes,
      checkpoints: [...this.checkpoints, newCheckpoint],
    });
  }

  finishWorkflow(finalSummary: string = 'Flujo multi-agente ejecutado exitosamente'): WorkflowAggregate {
    const updatedNodes = this.nodes.map((node) =>
      node.id === 'synthesizer' ? node.withStatus('COMPLETED', finalSummary) : node
    );

    return new WorkflowAggregate({
      id: this.id,
      tenantId: this.tenantId,
      graphName: this.graphName,
      status: 'COMPLETED',
      activeNodeId: null,
      nodes: updatedNodes,
      checkpoints: this.checkpoints,
    });
  }
}
