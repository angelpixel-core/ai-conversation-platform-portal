import { describe, it, expect } from 'vitest';
import { Citation } from './Citation';

describe('Citation Value Object', () => {
  it('formats similarity score as percentage relevance', () => {
    const citation = new Citation(
      'doc-101',
      'manual_seguridad.pdf',
      'chunk-3',
      0.924,
      'Antigravity enforces strict multi-tenant data isolation.'
    );

    expect(citation.formattedScore).toBe('92% relevancia');
    expect(citation.isHighRelevance).toBe(true);
  });

  it('identifies moderate or low relevance', () => {
    const citation = new Citation(
      'doc-102',
      'guia_general.pdf',
      'chunk-1',
      0.68,
      'Información complementaria sin relación directa.'
    );

    expect(citation.formattedScore).toBe('68% relevancia');
    expect(citation.isHighRelevance).toBe(false);
  });

  it('truncates long snippet to 140 characters with ellipsis', () => {
    const longText =
      'Este es un texto sumamente largo que describe exhaustivamente el procedimiento operativo estándar de una cafetería industrial moderna, incluyendo protocolos de molienda y sanitización profunda.';
    const citation = new Citation('doc-103', 'manual.pdf', 'chunk-5', 0.95, longText);

    expect(citation.truncatedSnippet.length).toBeLessThanOrEqual(143);
    expect(citation.truncatedSnippet.endsWith('...')).toBe(true);
  });

  it('does not truncate snippet if shorter than 140 characters', () => {
    const shortText = 'Texto breve y conciso.';
    const citation = new Citation('doc-104', 'manual.pdf', 'chunk-1', 0.88, shortText);

    expect(citation.truncatedSnippet).toBe(shortText);
  });
});
