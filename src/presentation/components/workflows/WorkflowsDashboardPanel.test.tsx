import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WorkflowsDashboardPanel } from './WorkflowsDashboardPanel';

describe('WorkflowsDashboardPanel Component', () => {
  it('renders master panel with title and initial demo workflow', async () => {
    render(<WorkflowsDashboardPanel tenantId="corp-acme" />);

    expect(screen.getByTestId('workflows-dashboard-panel')).toBeInTheDocument();
    expect(screen.getByText(/CU-09: ORQUESTACIÓN MULTI-AGENTE & CHECKPOINTS/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('workflow-graph-viewer')).toBeInTheDocument();
      expect(screen.getByTestId('workflow-resume-controls')).toBeInTheDocument();
      expect(screen.getAllByText(/PAUSADO/i).length).toBeGreaterThan(0);
    });
  });

  it('allows resuming the paused workflow from the resume controls', async () => {
    render(<WorkflowsDashboardPanel tenantId="corp-acme" />);

    await waitFor(() => {
      expect(screen.getByTestId('workflow-resume-controls')).toBeInTheDocument();
    });

    const resumeBtn = screen.getByRole('button', { name: /reanudar flujo/i });
    fireEvent.click(resumeBtn);

    await waitFor(() => {
      expect(screen.getByText(/flujo multi-agente completado exitosamente/i)).toBeInTheDocument();
    });
  });
});
