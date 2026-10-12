export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
export type ApprovalDecision = 'approve' | 'reject';

export interface ToolApprovalProps {
  id: string;
  toolName: string;
  argumentsPayload: Record<string, unknown>;
  requestedBy: string;
  requestReason: string;
  status: ApprovalStatus;
  createdAt: Date;
  resolvedBy?: string;
  decisionReason?: string;
  resolvedAt?: Date;
}

export class ToolApprovalRequest {
  constructor(
    public readonly id: string,
    public readonly toolName: string,
    public readonly argumentsPayload: Record<string, unknown>,
    public readonly requestedBy: string,
    public readonly requestReason: string,
    public readonly status: ApprovalStatus,
    public readonly createdAt: Date,
    public readonly resolvedBy?: string,
    public readonly decisionReason?: string,
    public readonly resolvedAt?: Date
  ) {}

  get isPending(): boolean {
    return this.status === 'PENDING';
  }

  get formattedArguments(): string {
    return JSON.stringify(this.argumentsPayload, null, 2);
  }

  withDecision(
    decision: ApprovalDecision,
    reason: string,
    resolvedBy: string,
    resolvedAt: Date = new Date()
  ): ToolApprovalRequest {
    if (this.status !== 'PENDING') {
      throw new Error(`Cannot resolve a request that is not PENDING (current status: ${this.status})`);
    }

    if (!reason || !reason.trim()) {
      throw new Error('Audit justification is required to resolve a tool approval request.');
    }

    const nextStatus: ApprovalStatus = decision === 'approve' ? 'APPROVED' : 'REJECTED';

    return new ToolApprovalRequest(
      this.id,
      this.toolName,
      this.argumentsPayload,
      this.requestedBy,
      this.requestReason,
      nextStatus,
      this.createdAt,
      resolvedBy,
      reason.trim(),
      resolvedAt
    );
  }
}
