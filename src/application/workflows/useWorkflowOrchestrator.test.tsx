import { describe, it, expect } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWorkflowOrchestrator } from './useWorkflowOrchestrator';
import { MockWorkflowsGateway } from '@/infrastructure/api/MockWorkflowsGateway';

describe('useWorkflowOrchestrator Hook', () => {
  it('loads initial demo workflow and its checkpoints', async () => {
    const gateway = new MockWorkflowsGateway();
    const { result } = renderHook(() =>
      useWorkflowOrchestrator({ tenantId: 'corp-acme', gateway, initialWorkflowId: 'wf-demo-1' })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.workflow).not.toBeNull();
    });

    expect(result.current.workflow?.id.value).toBe('wf-demo-1');
    expect(result.current.workflow?.status).toBe('PAUSED_FOR_APPROVAL');
    expect(result.current.checkpoints.length).toBeGreaterThanOrEqual(3);
  });

  it('starts a new workflow and updates state to RUNNING', async () => {
    const gateway = new MockWorkflowsGateway();
    const { result } = renderHook(() =>
      useWorkflowOrchestrator({ tenantId: 'corp-acme', gateway, initialWorkflowId: '' })
    );

    await act(async () => {
      await result.current.startNewWorkflow('Investigar riesgos');
    });

    expect(result.current.workflow?.status).toBe('RUNNING');
    expect(result.current.workflow?.activeNodeId).toBe('supervisor');
    expect(result.current.checkpoints).toHaveLength(1);
  });

  it('resumes a paused workflow when operator provides override text', async () => {
    const gateway = new MockWorkflowsGateway();
    const { result } = renderHook(() =>
      useWorkflowOrchestrator({ tenantId: 'corp-acme', gateway, initialWorkflowId: 'wf-demo-1' })
    );

    await waitFor(() => {
      expect(result.current.workflow?.status).toBe('PAUSED_FOR_APPROVAL');
    });

    await act(async () => {
      await result.current.resumeWorkflow('Aprobado manualmente para síntesis final');
    });

    expect(result.current.workflow?.status).toBe('COMPLETED');
    expect(result.current.workflow?.nodes.find((n) => n.id === 'synthesizer')?.isCompleted).toBe(true);
  });

  it('manages inspectCheckpoint selection modal state', async () => {
    const gateway = new MockWorkflowsGateway();
    const { result } = renderHook(() =>
      useWorkflowOrchestrator({ tenantId: 'corp-acme', gateway, initialWorkflowId: 'wf-demo-1' })
    );

    await waitFor(() => {
      expect(result.current.checkpoints.length).toBeGreaterThan(0);
    });

    act(() => {
      result.current.inspectCheckpoint(result.current.checkpoints[0]);
    });

    expect(result.current.selectedCheckpoint?.id).toBe(result.current.checkpoints[0].id);

    act(() => {
      result.current.inspectCheckpoint(null);
    });

    expect(result.current.selectedCheckpoint).toBeNull();
  });
});
