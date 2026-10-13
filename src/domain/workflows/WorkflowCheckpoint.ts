export interface WorkflowCheckpointProps {
  id: string;
  version: number;
  node: string;
  stateSnapshot: Record<string, unknown>;
  createdAt: Date;
}

export class WorkflowCheckpoint {
  public readonly id: string;
  public readonly version: number;
  public readonly node: string;
  public readonly stateSnapshot: Record<string, unknown>;
  public readonly createdAt: Date;

  constructor(props: WorkflowCheckpointProps) {
    if (!props.id || props.id.trim().length === 0) {
      throw new Error('Checkpoint id cannot be empty');
    }
    if (props.version < 1) {
      throw new Error('Checkpoint version must be >= 1');
    }
    this.id = props.id.trim();
    this.version = props.version;
    this.node = props.node;
    this.stateSnapshot = props.stateSnapshot;
    this.createdAt = props.createdAt;
  }

  get formattedSnapshot(): string {
    return JSON.stringify(this.stateSnapshot, null, 2);
  }

  get keyCount(): number {
    return Object.keys(this.stateSnapshot).length;
  }
}
