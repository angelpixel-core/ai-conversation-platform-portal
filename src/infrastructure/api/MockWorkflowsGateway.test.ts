import { describe, it, expect } from 'vitest';
import { MockWorkflowsGateway } from './MockWorkflowsGateway';

describe('MockWorkflowsGateway', () => {
  it('retrieves pre-seeded demo workflow in paused auditor state', async () => {
    const gateway = new MockWorkflowsGateway();
    const wf = await gateway.getWorkflow('corp-acme', 'wf-demo-1');

    expect(wf.id.value).toBe('wf-demo-1');
    expect(wf.status).toBe('PAUSED_FOR_APPROVAL');
    expect(wf.activeNodeId).toBe('auditor');
    expect(wf.checkpoints.length).toBeGreaterThanOrEqual(3);
  });

  it('starts a new workflow and registers it with status RUNNING', async () => {
    const gateway = new MockWorkflowsGateway();
    const wf = await gateway.startWorkflow({
      tenantId: 'globex',
      initialContext: { query: 'Investigar balance fiscal' },
    });

    expect(wf.tenantId).toBe('globex');
    expect(wf.status).toBe('RUNNING');
    expect(wf.activeNodeId).toBe('supervisor');

    const checkpoints = await gateway.getCheckpoints('globex', wf.id.value);
    expect(checkpoints).toHaveLength(1);
    expect(checkpoints[0].node).toBe('supervisor');
  });

  it('resumes a paused workflow with override and completes the flow', async () => {
    const gateway = new MockWorkflowsGateway();
    const resumed = await gateway.resumeWorkflow({
      tenantId: 'corp-acme',
      workflowId: 'wf-demo-1',
      nodeId: 'auditor',
      overrideContext: {
        supervisor_override: 'Aprobación autorizada por el jefe de operaciones',
      },
    });

    expect(resumed.status).toBe('COMPLETED');
    expect(resumed.nodes.find((n) => n.id === 'auditor')?.isCompleted).toBe(true);
    expect(resumed.nodes.find((n) => n.id === 'synthesizer')?.isCompleted).toBe(true);
  });

  it('throws error when requesting nonexistent workflow', async () => {
    const gateway = new MockWorkflowsGateway();
    await expect(gateway.getWorkflow('corp-acme', 'non-existent')).rejects.toThrow(
      'Workflow with ID non-existent not found'
    );
  });
});
