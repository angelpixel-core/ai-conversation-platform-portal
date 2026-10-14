import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpWorkflowsAdapter } from './HttpWorkflowsAdapter';
import * as apiClient from './apiClient';

describe('HttpWorkflowsAdapter', () => {
  let adapter: HttpWorkflowsAdapter;

  beforeEach(() => {
    vi.restoreAllMocks();
    adapter = new HttpWorkflowsAdapter();
  });

  it('calls startWorkflow via apiFetch and maps response to domain aggregate', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockResolvedValueOnce({
      workflow_id: 'wf-live-99',
      status: 'RUNNING',
      graph_name: 'research_and_audit_pipeline',
      active_node_id: 'supervisor',
      checkpoints: [
        {
          checkpoint_id: 'chk-1',
          version: 1,
          node: 'supervisor',
          state_snapshot: { query: 'auditoría' },
          created_at: '2026-10-12T20:00:00Z',
        },
      ],
    });

    const wf = await adapter.startWorkflow({
      tenantId: 'corp-acme',
      graphName: 'research_and_audit_pipeline',
      initialContext: { query: 'auditoría' },
    });

    expect(wf.id.value).toBe('wf-live-99');
    expect(wf.status).toBe('RUNNING');
    expect(wf.activeNodeId).toBe('supervisor');
    expect(wf.checkpoints).toHaveLength(1);
    expect(wf.checkpoints[0].id).toBe('chk-1');
  });

  it('falls back to MockWorkflowsGateway on network error', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockRejectedValueOnce(new Error('Network error 500'));

    const wf = await adapter.getWorkflow('corp-acme', 'wf-demo-1');
    expect(wf.id.value).toBe('wf-demo-1');
    expect(wf.status).toBe('PAUSED_FOR_APPROVAL');
  });
});
