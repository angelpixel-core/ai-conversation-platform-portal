import { describe, it, expect } from 'vitest';
import { KnowledgeDocument } from './KnowledgeDocument';

describe('KnowledgeDocument Domain Entity', () => {
  const initialDoc = new KnowledgeDocument(
    'doc-123',
    'normativa_seguridad.pdf',
    'application/pdf',
    'INGESTED',
    0,
    new Date('2026-10-05T22:00:00Z')
  );

  it('correctly reports ingestion and processing state', () => {
    expect(initialDoc.isProcessing).toBe(true);
    expect(initialDoc.isIndexed).toBe(false);
    expect(initialDoc.chunksCount).toBe(0);
  });

  it('transitions to INDEXED state with generated chunks count and timestamp', () => {
    const indexed = initialDoc.withIndexed(6, new Date('2026-10-05T22:00:15Z'));

    expect(indexed.status).toBe('INDEXED');
    expect(indexed.isIndexed).toBe(true);
    expect(indexed.isProcessing).toBe(false);
    expect(indexed.chunksCount).toBe(6);
    expect(indexed.indexedAt).toBeInstanceOf(Date);
  });

  it('transitions to FAILED state with error reason', () => {
    const failed = initialDoc.withFailed('Corrupted PDF header or unsupported encryption');

    expect(failed.status).toBe('FAILED');
    expect(failed.isProcessing).toBe(false);
    expect(failed.isIndexed).toBe(false);
    expect(failed.errorReason).toBe('Corrupted PDF header or unsupported encryption');
  });
});
