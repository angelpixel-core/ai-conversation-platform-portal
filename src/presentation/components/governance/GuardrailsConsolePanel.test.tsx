import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GuardrailsConsolePanel } from './GuardrailsConsolePanel';

describe('GuardrailsConsolePanel Component', () => {
  it('renders master panel with metrics, simulation buttons, and audit table', async () => {
    render(<GuardrailsConsolePanel />);

    expect(screen.getByText('Centro de Observabilidad & Guardrails de Seguridad')).toBeDefined();
    expect(screen.getByText('Simular Prompt Injection')).toBeDefined();
    expect(screen.getByText('Simular Fuga de Tarjeta')).toBeDefined();
    expect(screen.getByText('Simular Contenido Tóxico')).toBeDefined();
    expect(screen.getByText('Total Incidentes')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('Registro Forense de Incidentes & Guardrails')).toBeDefined();
    });
  });

  it('triggers attack simulation and displays IncidentAlertBanner', async () => {
    render(<GuardrailsConsolePanel />);

    const simBtn = screen.getByText('Simular Prompt Injection');
    fireEvent.click(simBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
      expect(screen.getByText(/Ataque Interceptado por Guardrails: PROMPT_INJECTION/i)).toBeDefined();
    });
  });
});
