import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { KnowledgePanel } from './KnowledgePanel';
import { MockKnowledgeGateway } from '@/infrastructure/api/MockKnowledgeGateway';

describe('KnowledgePanel Component', () => {
  it('renders header, dropzone, and document table', async () => {
    const gateway = new MockKnowledgeGateway();
    render(<KnowledgePanel gateway={gateway} tenantId="corp-acme" />);

    expect(screen.getByText(/Base de Conocimiento & RAG Híbrido/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/politica_seguridad_2026.pdf/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/manual_operaciones_barista.pdf/i)).toBeInTheDocument();
  });

  it('opens citation drawer when clicking on simular cita', async () => {
    const gateway = new MockKnowledgeGateway();
    render(<KnowledgePanel gateway={gateway} tenantId="corp-acme" />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Simular Cita/i })[0]).toBeInTheDocument();
    });

    const simulateBtn = screen.getAllByRole('button', { name: /Simular Cita/i })[0];
    fireEvent.click(simulateBtn);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/Fuente Documental/i)).toBeInTheDocument();
    });
  });
});
