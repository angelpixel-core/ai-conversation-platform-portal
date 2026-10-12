import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CitationDrawer } from './CitationDrawer';
import { Citation } from '@/domain/knowledge/Citation';

describe('CitationDrawer Component', () => {
  const sampleCitation = new Citation(
    'doc-7819',
    'manual_operaciones_barista.pdf',
    'chunk-4',
    0.93,
    'La temperatura del agua en el grupo térmico debe mantenerse estrictamente entre 92°C y 94°C.'
  );

  it('renders citation details, document name, score, and snippet', () => {
    render(
      <CitationDrawer
        isOpen={true}
        citation={sampleCitation}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/manual_operaciones_barista.pdf/i)).toBeInTheDocument();
    expect(screen.getByText(/93% relevancia/i)).toBeInTheDocument();
    expect(screen.getByText(/chunk-4/i)).toBeInTheDocument();
    expect(screen.getByText(/92°C y 94°C/i)).toBeInTheDocument();
  });

  it('triggers onClose when clicking close button', () => {
    const handleClose = vi.fn();
    render(
      <CitationDrawer
        isOpen={true}
        citation={sampleCitation}
        onClose={handleClose}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /Cerrar panel/i });
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalled();
  });
});
