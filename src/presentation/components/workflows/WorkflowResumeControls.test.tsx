import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkflowResumeControls } from './WorkflowResumeControls';

describe('WorkflowResumeControls Component', () => {
  it('renders override input and triggers onResume with text on submit', () => {
    const handleResume = vi.fn();
    render(<WorkflowResumeControls onResume={handleResume} />);

    expect(screen.getByTestId('workflow-resume-controls')).toBeInTheDocument();
    const input = screen.getByLabelText(/supervisor_override/i);
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'Override autorizado por CISO' } });
    const submitBtn = screen.getByRole('button', { name: /reanudar flujo/i });
    fireEvent.click(submitBtn);

    expect(handleResume).toHaveBeenCalledWith('Override autorizado por CISO');
  });

  it('disables submit button and shows loading state when isResuming is true', () => {
    render(<WorkflowResumeControls isResuming={true} onResume={vi.fn()} />);
    expect(screen.getByRole('button', { name: /reanudando flujo/i })).toBeDisabled();
  });
});
