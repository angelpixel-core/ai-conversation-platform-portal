import {
  ApprovalsGateway,
  ResolveApprovalParams,
} from '@/domain/approvals/ApprovalsGateway';
import {
  ToolApprovalRequest,
  ApprovalStatus,
} from '@/domain/approvals/ToolApprovalRequest';
import { apiFetch } from './apiClient';
import { MockApprovalsGateway } from './MockApprovalsGateway';

interface RawApprovalDto {
  approval_id?: string;
  id?: string;
  tool_name?: string;
  toolName?: string;
  arguments?: Record<string, unknown>;
  argumentsPayload?: Record<string, unknown>;
  requested_by?: string;
  requestedBy?: string;
  reason?: string;
  requestReason?: string;
  status?: string;
  created_at?: string;
  createdAt?: string;
  resolved_by?: string;
  resolvedBy?: string;
  decision_reason?: string;
  decisionReason?: string;
  resolved_at?: string;
  resolvedAt?: string;
}

export class HttpApprovalsAdapter implements ApprovalsGateway {
  private fallbackMock = new MockApprovalsGateway();

  private mapDtoToEntity(dto: RawApprovalDto): ToolApprovalRequest {
    const id = dto.approval_id || dto.id || `appr-${Date.now()}`;
    const toolName = dto.tool_name || dto.toolName || 'unknown_tool';
    const argumentsPayload = dto.arguments || dto.argumentsPayload || {};
    const requestedBy = dto.requested_by || dto.requestedBy || 'ai-agent';
    const requestReason = dto.reason || dto.requestReason || 'Action required';
    const rawStatus = (dto.status || 'PENDING').toUpperCase() as ApprovalStatus;
    const createdAt = dto.created_at || dto.createdAt ? new Date(dto.created_at || dto.createdAt!) : new Date();
    const resolvedBy = dto.resolved_by || dto.resolvedBy;
    const decisionReason = dto.decision_reason || dto.decisionReason;
    const resolvedAt = dto.resolved_at || dto.resolvedAt ? new Date(dto.resolved_at || dto.resolvedAt!) : undefined;

    return new ToolApprovalRequest(
      id,
      toolName,
      argumentsPayload,
      requestedBy,
      requestReason,
      rawStatus,
      createdAt,
      resolvedBy,
      decisionReason,
      resolvedAt
    );
  }

  async getPendingApprovals(tenantId: string): Promise<ToolApprovalRequest[]> {
    try {
      const data = await apiFetch<RawApprovalDto[]>(
        `/tenants/${encodeURIComponent(tenantId)}/approvals/pending`,
        {
          headers: {
            'X-Tenant-Id': tenantId,
          },
        }
      );

      if (!Array.isArray(data)) {
        return this.fallbackMock.getPendingApprovals(tenantId);
      }

      return data.map((dto) => this.mapDtoToEntity(dto));
    } catch {
      return this.fallbackMock.getPendingApprovals(tenantId);
    }
  }

  async getAllApprovals(tenantId: string): Promise<ToolApprovalRequest[]> {
    try {
      const data = await apiFetch<RawApprovalDto[]>(
        `/tenants/${encodeURIComponent(tenantId)}/approvals`,
        {
          headers: {
            'X-Tenant-Id': tenantId,
          },
        }
      );
      if (Array.isArray(data)) {
        return data.map((dto) => this.mapDtoToEntity(dto));
      }
    } catch {
      // fallback
    }
    return this.fallbackMock.getAllApprovals(tenantId);
  }

  async resolveApproval(params: ResolveApprovalParams): Promise<ToolApprovalRequest> {
    try {
      const data = await apiFetch<RawApprovalDto>(
        `/tenants/${encodeURIComponent(params.tenantId)}/approvals/${encodeURIComponent(params.approvalId)}/decision`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-Id': params.tenantId,
          },
          body: JSON.stringify({
            decision: params.decision,
            reason: params.reason,
            resolved_by: params.resolvedBy,
          }),
        }
      );

      return this.mapDtoToEntity(data);
    } catch {
      return this.fallbackMock.resolveApproval(params);
    }
  }

  async simulateNewApprovalRequest(tenantId: string): Promise<ToolApprovalRequest> {
    return this.fallbackMock.simulateNewApprovalRequest(tenantId);
  }
}
