import { ToolApprovalRequest, ApprovalDecision } from './ToolApprovalRequest';

export interface ResolveApprovalParams {
  tenantId: string;
  approvalId: string;
  decision: ApprovalDecision;
  reason: string;
  resolvedBy: string;
}

export interface ApprovalsGateway {
  getPendingApprovals(tenantId: string): Promise<ToolApprovalRequest[]>;
  getAllApprovals(tenantId: string): Promise<ToolApprovalRequest[]>;
  resolveApproval(params: ResolveApprovalParams): Promise<ToolApprovalRequest>;
  simulateNewApprovalRequest?(tenantId: string): Promise<ToolApprovalRequest>;
}
