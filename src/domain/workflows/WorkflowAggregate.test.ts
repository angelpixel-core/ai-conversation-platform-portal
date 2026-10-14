import { describe, it, expect } from 'vitest';
import { WorkflowAggregate } from './WorkflowAggregate';

describe('WorkflowAggregate Aggregate', () => {
  it('creates initial workflow with 4 default nodes and IDLE status', () => {
    const wf = WorkflowAggregate.createNew('wf-test-1', 'corp-acme');
    expect(wf.id.value).toBe('wf-test-1');
    expect(wf.tenantId).toBe('corp-acme');
    expect(wf.status).toBe('IDLE');
    expect(wf.nodes).toHaveLength(4);
    expect(wf.checkpoints).toHaveLength(0);
    expect(wf.activeNodeId).toBeNull();
  });

  it('starts workflow, sets supervisor to RUNNING, and saves checkpoint v1', () => {
    const wf = WorkflowAggregate.createNew('wf-test-1', 'corp-acme');
    const started = wf.start({ query: 'Auditar políticas de seguridad' });

    expect(started.status).toBe('RUNNING');
    expect(started.activeNodeId).toBe('supervisor');
    expect(started.nodes.find((n) => n.id === 'supervisor')?.isRunning).toBe(true);
    expect(started.checkpoints).toHaveLength(1);
    expect(started.checkpoints[0].version).toBe(1);
    expect(started.checkpoints[0].node).toBe('supervisor');
  });

  it('performs handoff from supervisor to researcher with new checkpoint v2', () => {
    const wf = WorkflowAggregate.createNew('wf-test-1', 'corp-acme').start();
    const handoffWf = wf.handoff('supervisor', 'researcher', 'Investigación iniciada', {
      findings: ['Artículo 4', 'Norma ISO 27001'],
    });

    expect(handoffWf.activeNodeId).toBe('researcher');
    expect(handoffWf.nodes.find((n) => n.id === 'supervisor')?.isCompleted).toBe(true);
    expect(handoffWf.nodes.find((n) => n.id === 'researcher')?.isRunning).toBe(true);
    expect(handoffWf.checkpoints).toHaveLength(2);
    expect(handoffWf.checkpoints[1].version).toBe(2);
    expect(handoffWf.checkpoints[1].node).toBe('researcher');
  });

  it('pauses for approval at auditor and enters PAUSED_FOR_APPROVAL status', () => {
    const wf = WorkflowAggregate.createNew('wf-test-1', 'corp-acme')
      .start()
      .handoff('supervisor', 'researcher', 'OK', {})
      .handoff('researcher', 'auditor', 'Auditoría requerida', {});

    const paused = wf.pauseForApproval('auditor', 'Operación sensible detectada', { risk_level: 'HIGH' });

    expect(paused.status).toBe('PAUSED_FOR_APPROVAL');
    expect(paused.activeNodeId).toBe('auditor');
    expect(paused.nodes.find((n) => n.id === 'auditor')?.isPaused).toBe(true);
  });

  it('resumes with operator override and delegates to synthesizer', () => {
    const wf = WorkflowAggregate.createNew('wf-test-1', 'corp-acme')
      .start()
      .handoff('supervisor', 'researcher', 'OK', {})
      .handoff('researcher', 'auditor', 'Auditoría', {})
      .pauseForApproval('auditor', 'Pausa', {});

    const resumed = wf.resumeWithOverride('auditor', {
      supervisor_override: 'Aprobado manualmente por SecOps',
    });

    expect(resumed.status).toBe('RUNNING');
    expect(resumed.activeNodeId).toBe('synthesizer');
    expect(resumed.nodes.find((n) => n.id === 'auditor')?.isCompleted).toBe(true);
    expect(resumed.nodes.find((n) => n.id === 'synthesizer')?.isRunning).toBe(true);

    const completed = resumed.finishWorkflow();
    expect(completed.status).toBe('COMPLETED');
    expect(completed.activeNodeId).toBeNull();
    expect(completed.nodes.find((n) => n.id === 'synthesizer')?.isCompleted).toBe(true);
  });
});
