import { NodeStatus } from './NodeStatus';
import { AgentRole, AGENT_ROLE_COLORS, AGENT_ROLE_NAMES } from './AgentRole';

export interface WorkflowNodeProps {
  id: string;
  name?: string;
  role: AgentRole;
  status: NodeStatus;
  description: string;
  outputSummary?: string;
}

export class WorkflowNode {
  public readonly id: string;
  public readonly name: string;
  public readonly role: AgentRole;
  public readonly status: NodeStatus;
  public readonly description: string;
  public readonly outputSummary?: string;

  constructor(props: WorkflowNodeProps) {
    if (!props.id || props.id.trim().length === 0) {
      throw new Error('WorkflowNode id cannot be empty');
    }
    this.id = props.id.trim();
    this.role = props.role;
    this.name = props.name || AGENT_ROLE_NAMES[props.role] || props.id;
    this.status = props.status;
    this.description = props.description;
    this.outputSummary = props.outputSummary;
  }

  get accentColor(): string {
    return AGENT_ROLE_COLORS[this.role] || '#000000';
  }

  get isRunning(): boolean {
    return this.status === 'RUNNING';
  }

  get isPaused(): boolean {
    return this.status === 'PAUSED_FOR_APPROVAL';
  }

  get isCompleted(): boolean {
    return this.status === 'COMPLETED';
  }

  withStatus(status: NodeStatus, outputSummary?: string): WorkflowNode {
    return new WorkflowNode({
      id: this.id,
      name: this.name,
      role: this.role,
      status,
      description: this.description,
      outputSummary: outputSummary ?? this.outputSummary,
    });
  }
}
