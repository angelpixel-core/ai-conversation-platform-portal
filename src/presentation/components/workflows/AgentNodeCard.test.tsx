import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgentNodeCard } from './AgentNodeCard';
import { WorkflowNode } from '@/domain/workflows/WorkflowNode';

describe('AgentNodeCard Component', () => {
  it('renders node details and role badge', () => {
    const node = new WorkflowNode({
      id: 'supervisor',
      role: 'supervisor',
      status: 'IDLE',
      description: 'Coordinador general del grafo',
    });

    render(<AgentNodeCard node={node} />);

    expect(screen.getByText('Supervisor Orquestador')).toBeInTheDocument();
    expect(screen.getByText('supervisor')).toBeInTheDocument();
    expect(screen.getByText('EN ESPERA')).toBeInTheDocument();
  });

  it('renders running state with active pulse styling', () => {
    const node = new WorkflowNode({
      id: 'researcher',
      role: 'researcher',
      status: 'RUNNING',
      description: 'Extracción de citas vectoriales',
    });

    render(<AgentNodeCard node={node} isActive={true} />);

    expect(screen.getByText('EN EJECUCIÓN')).toBeInTheDocument();
    const card = screen.getByTestId('agent-node-researcher');
    expect(card.className).toContain('ring-yellow-400');
  });

  it('renders paused state and output summary when waiting for approval', () => {
    const node = new WorkflowNode({
      id: 'auditor',
      role: 'auditor',
      status: 'PAUSED_FOR_APPROVAL',
      description: 'Control de riesgos',
      outputSummary: 'Riesgo alto detectado',
    });

    render(<AgentNodeCard node={node} />);

    expect(screen.getByText('PAUSADO (HITL)')).toBeInTheDocument();
    expect(screen.getByText(/Riesgo alto detectado/)).toBeInTheDocument();
  });
});
