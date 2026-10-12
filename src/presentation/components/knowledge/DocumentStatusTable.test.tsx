import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DocumentStatusTable } from './DocumentStatusTable';
import { KnowledgeDocument } from '@/domain/knowledge/KnowledgeDocument';

describe('DocumentStatusTable Component', () => {
  const documents: KnowledgeDocument[] = [
    new KnowledgeDocument(
      'doc-1',
      'politica_seguridad.pdf',
      'application/pdf',
      'INDEXED',
      8,
      new Date('2026-10-05T20:00:00Z'),
      new Date('2026-10-05T20:00:15Z'),
      undefined,
      '342 KB'
    ),
    new KnowledgeDocument(
      'doc-2',
      'manual_en_proceso.pdf',
      'application/pdf',
      'INGESTED',
      0,
      new Date('2026-10-05T21:00:00Z'),
      undefined,
      undefined,
      '1.1 MB'
    ),
  ];

  it('renders document titles, status badges, chunk counts, and sizes', () => {
    render(
      <DocumentStatusTable
        documents={documents}
        onDelete={vi.fn()}
        onTestRagQuery={vi.fn()}
      />
    );

    expect(screen.getByText(/politica_seguridad.pdf/i)).toBeInTheDocument();
    expect(screen.getByText(/manual_en_proceso.pdf/i)).toBeInTheDocument();
    expect(screen.getByText(/INDEXED/i)).toBeInTheDocument();
    expect(screen.getByText(/INGESTED/i)).toBeInTheDocument();
    expect(screen.getByText(/8 chunks/i)).toBeInTheDocument();
  });

  it('allows clicking test RAG query to trigger citation inspection', () => {
    const handleTestRag = vi.fn();
    render(
      <DocumentStatusTable
        documents={documents}
        onDelete={vi.fn()}
        onTestRagQuery={handleTestRag}
      />
    );

    const testRagButton = screen.getAllByRole('button', { name: /Simular Cita/i })[0];
    fireEvent.click(testRagButton);

    expect(handleTestRag).toHaveBeenCalled();
  });
});
