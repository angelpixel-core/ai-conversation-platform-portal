import {
  ApprovalsGateway,
  ResolveApprovalParams,
} from '@/domain/approvals/ApprovalsGateway';
import { ToolApprovalRequest } from '@/domain/approvals/ToolApprovalRequest';

export class MockApprovalsGateway implements ApprovalsGateway {
  private approvalsByTenant: Map<string, ToolApprovalRequest[]> = new Map();

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData(): void {
    const defaultList: ToolApprovalRequest[] = [
      new ToolApprovalRequest(
        'appr-7925e0bc-2358-4560-bf64-53c8db4da2d9',
        'refund_payment',
        {
          amount: 500,
          currency: 'USD',
          customerId: 'cust-8812',
          transactionId: 'txn-9921448',
        },
        'agent-financial-advisor',
        'Customer cancellation refund requested outside standard automated SLA',
        'PENDING',
        new Date(Date.now() - 1000 * 60 * 15) // 15 mins ago
      ),
      new ToolApprovalRequest(
        'appr-4318c1ab-9812-4011-a832-119280ab4410',
        'execute_sql_query',
        {
          database: 'crm_prod',
          table: 'legacy_accounts',
          query: 'UPDATE customer_status SET tier = "PREMIUM_VIP" WHERE ltv > 10000;',
          dryRun: false,
        },
        'agent-database-admin',
        'Batch customer tier recalibration requested during active campaign',
        'PENDING',
        new Date(Date.now() - 1000 * 60 * 45) // 45 mins ago
      ),
      new ToolApprovalRequest(
        'appr-98124011-a832-4318-c1ab-53c8db4da2d9',
        'export_customer_data',
        {
          format: 'parquet',
          destinationBucket: 's3://corp-analytics-exports/2026/q3/',
          recordsCount: 250000,
          containsPII: true,
        },
        'agent-analytics-exporter',
        'Periodic dataset export for regulatory compliance auditing',
        'APPROVED',
        new Date(Date.now() - 1000 * 60 * 120),
        'compliance-lead@corp.com',
        'Pre-authorized by DPO under quarterly audit plan',
        new Date(Date.now() - 1000 * 60 * 90)
      ),
    ];

    this.approvalsByTenant.set('corp-acme', [...defaultList]);
    this.approvalsByTenant.set('tenant-acme', [...defaultList]);
    this.approvalsByTenant.set('default', [...defaultList]);
  }

  private getList(tenantId: string): ToolApprovalRequest[] {
    if (!this.approvalsByTenant.has(tenantId)) {
      this.seedDefaultData();
      return this.approvalsByTenant.get('corp-acme') || [];
    }
    return this.approvalsByTenant.get(tenantId)!;
  }

  async getPendingApprovals(tenantId: string): Promise<ToolApprovalRequest[]> {
    const list = this.getList(tenantId);
    return list.filter((item) => item.isPending);
  }

  async getAllApprovals(tenantId: string): Promise<ToolApprovalRequest[]> {
    const list = this.getList(tenantId);
    return [...list];
  }

  async resolveApproval(params: ResolveApprovalParams): Promise<ToolApprovalRequest> {
    const list = this.getList(params.tenantId);
    const index = list.findIndex((item) => item.id === params.approvalId);

    if (index === -1) {
      throw new Error(`Approval request with ID ${params.approvalId} not found`);
    }

    const current = list[index];
    const updated = current.withDecision(
      params.decision,
      params.reason,
      params.resolvedBy,
      new Date()
    );

    list[index] = updated;
    this.approvalsByTenant.set(params.tenantId, list);
    return updated;
  }

  async simulateNewApprovalRequest(tenantId: string): Promise<ToolApprovalRequest> {
    const list = this.getList(tenantId);
    const randomTools = [
      {
        toolName: 'rotate_api_credentials',
        payload: { service: 'stripe_connect', keyType: 'live_restricted' },
        requestedBy: 'agent-devops-security',
        reason: 'Automated 90-day secret rotation policy enforcement',
      },
      {
        toolName: 'modify_subscription_tier',
        payload: { customerId: 'cust-9031', newTier: 'ENTERPRISE_UNLIMITED', discountApplied: '25%' },
        requestedBy: 'agent-sales-negotiator',
        reason: 'Special executive waiver agreed for annual enterprise renewal',
      },
    ];

    const randomChoice = randomTools[Math.floor(Math.random() * randomTools.length)];
    const newReq = new ToolApprovalRequest(
      `appr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`,
      randomChoice.toolName,
      randomChoice.payload,
      randomChoice.requestedBy,
      randomChoice.reason,
      'PENDING',
      new Date()
    );

    list.unshift(newReq);
    this.approvalsByTenant.set(tenantId, list);
    return newReq;
  }
}
