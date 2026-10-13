import { describe, it, expect } from 'vitest';
import { WorkflowCheckpoint } from './WorkflowCheckpoint';

describe('WorkflowCheckpoint Entity', () => {
  it('creates valid checkpoint and formats JSON snapshot', () => {
    const chk = new WorkflowCheckpoint({
      id: 'chk-v1',
      version: 1,
      node: 'supervisor',
      stateSnapshot: { query: 'Auditar seguridad', stage: 'initial' },
      createdAt: new Date('2026-10-12T20:00:00Z'),
    });

    expect(chk.id).toBe('chk-v1');
    expect(chk.version).toBe(1);
    expect(chk.node).toBe('supervisor');
    expect(chk.keyCount).toBe(2);
    expect(chk.formattedSnapshot).toContain('"query": "Auditar seguridad"');
    expect(chk.formattedSnapshot).toContain('"stage": "initial"');
  });

  it('throws error when id is empty or version is less than 1', () => {
    expect(
      () =>
        new WorkflowCheckpoint({
          id: '',
          version: 1,
          node: 'supervisor',
          stateSnapshot: {},
          createdAt: new Date(),
        })
    ).toThrow('Checkpoint id cannot be empty');

    expect(
      () =>
        new WorkflowCheckpoint({
          id: 'chk-1',
          version: 0,
          node: 'supervisor',
          stateSnapshot: {},
          createdAt: new Date(),
        })
    ).toThrow('Checkpoint version must be >= 1');
  });
});
