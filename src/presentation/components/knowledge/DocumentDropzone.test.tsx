import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DocumentDropzone } from './DocumentDropzone';

describe('DocumentDropzone Component', () => {
  it('renders upload instructions, supported formats, and tactile styling', () => {
    render(<DocumentDropzone onUpload={vi.fn()} isUploading={false} />);

    expect(screen.getByText(/Arrastra documentos o haz clic para subir/i)).toBeInTheDocument();
    expect(screen.getByText(/PDF, DOCX, TXT, MD/i)).toBeInTheDocument();
  });

  it('provides quick sample document buttons for instant testing', () => {
    const handleUpload = vi.fn();
    render(<DocumentDropzone onUpload={handleUpload} isUploading={false} />);

    const sampleButton = screen.getByRole('button', { name: /Subir Manual de Mantenimiento/i });
    fireEvent.click(sampleButton);

    expect(handleUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        name: expect.stringContaining('.pdf'),
      })
    );
  });

  it('displays loading state during upload', () => {
    render(<DocumentDropzone onUpload={vi.fn()} isUploading={true} />);

    expect(screen.getByText(/Ingesta asíncrona en curso/i)).toBeInTheDocument();
  });
});
