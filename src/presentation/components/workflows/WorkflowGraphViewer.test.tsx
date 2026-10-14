import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkflowGraphViewer } from './WorkflowGraphViewer';
import { WorkflowAggregate } from '@/domain/workflows/WorkflowAggregate';

describe('WorkflowGraphViewer Component', () => {
  it('renders graph header and all 4 agent nodes', () => {
    const wf = WorkflowAggregate.createNew('wf-1', 'corp-acme');
    render(<WorkflowGraphViewer workflow={wf} />);

    expect(screen.getByTestId('workflow-graph-viewer')).toBeInTheDocument();
    expect(screen.getByText('Supervisor Orquestador')).toBeInTheDocument();
    expect(screen.getByText('Investigador RAG')).toBeInTheDocument();
    expect(screen.getByText('Auditor HITL Guard')).toBeInTheDocument();
    expect(screen.getByText('Sintetizador Ejecutivo')).toBeInTheDocument();
  });

  it('displays active node badge in header', () => {
    const wf = WorkflowAggregate.createNew('wf-1', 'corp-acme').start();
    render(<WorkflowGraphViewer workflow={wf} />);

    expect(screen.getByText('ACTIVO: SUPERVISOR')).toBeInTheDocument();
  });
});
