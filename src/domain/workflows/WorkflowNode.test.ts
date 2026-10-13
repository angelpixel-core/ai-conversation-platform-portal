import { describe, it, expect } from 'vitest';
import { WorkflowNode } from './WorkflowNode';

describe('WorkflowNode Entity', () => {
  it('instantiates valid node and resolves accentColor and name', () => {
    const node = new WorkflowNode({
      id: 'supervisor-node',
      role: 'supervisor',
      status: 'RUNNING',
      description: 'Coordina los agentes',
    });

    expect(node.id).toBe('supervisor-node');
    expect(node.name).toBe('Supervisor Orquestador');
    expect(node.accentColor).toBe('#8B5CF6');
    expect(node.isRunning).toBe(true);
    expect(node.isCompleted).toBe(false);
  });

  it('throws error when id is empty', () => {
    expect(
      () =>
        new WorkflowNode({
          id: '',
          role: 'researcher',
          status: 'IDLE',
          description: '',
        })
    ).toThrow('WorkflowNode id cannot be empty');
  });

  it('creates updated node with new status and summary', () => {
    const initial = new WorkflowNode({
      id: 'auditor-node',
      role: 'auditor',
      status: 'RUNNING',
      description: 'Evalúa riesgos',
    });

    const updated = initial.withStatus('PAUSED_FOR_APPROVAL', 'Requiere intervención humana');
    expect(updated.status).toBe('PAUSED_FOR_APPROVAL');
    expect(updated.isPaused).toBe(true);
    expect(updated.outputSummary).toBe('Requiere intervención humana');
    // Immutability check
    expect(initial.status).toBe('RUNNING');
  });
});
