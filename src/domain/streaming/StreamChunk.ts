export interface StreamChunkProps {
  sequenceId: number;
  text: string;
  isDone?: boolean;
  timestamp?: Date;
}

export class StreamChunk {
  readonly sequenceId: number;
  readonly text: string;
  readonly isDone: boolean;
  readonly timestamp: Date;

  constructor(props: StreamChunkProps) {
    if (props.sequenceId < 0 || !Number.isInteger(props.sequenceId)) {
      throw new Error('Sequence ID must be a non-negative integer');
    }

    this.sequenceId = props.sequenceId;
    this.text = props.text ?? '';
    this.isDone = Boolean(props.isDone);
    this.timestamp = props.timestamp ?? new Date();
  }

  equals(other: StreamChunk): boolean {
    return (
      this.sequenceId === other.sequenceId &&
      this.text === other.text &&
      this.isDone === other.isDone
    );
  }
}
