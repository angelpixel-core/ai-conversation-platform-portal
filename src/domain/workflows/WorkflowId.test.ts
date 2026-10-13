import { describe, it, expect } from 'vitest';
import { WorkflowId } from './WorkflowId';

describe('WorkflowId Value Object', () => {
  it('creates valid workflow ID and trims whitespace', () => {
    const id = new WorkflowId('  wf-12345  ');
    expect(id.value).toBe('wf-12345');
    expect(id.toString()).toBe('wf-12345');
  });

  it('throws error on empty or whitespace-only ID', () => {
    expect(() => new WorkflowId('')).toThrow('WorkflowId cannot be empty');
    expect(() => new WorkflowId('   ')).toThrow('WorkflowId cannot be empty');
  });

  it('checks equality correctly', () => {
    const id1 = new WorkflowId('wf-abc');
    const id2 = new WorkflowId('wf-abc');
    const id3 = new WorkflowId('wf-xyz');
    expect(id1.equals(id2)).toBe(true);
    expect(id1.equals(id3)).toBe(false);
  });
});
