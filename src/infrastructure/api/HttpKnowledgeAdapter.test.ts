import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpKnowledgeAdapter } from './HttpKnowledgeAdapter';
import * as apiClient from './apiClient';

describe('HttpKnowledgeAdapter Infrastructure', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('uploads document and parses HTTP 202 response into INGESTED KnowledgeDocument', async () => {
    const mockApiResponse = {
      document_id: 'doc-999',
      filename: 'seguridad.pdf',
      status: 'INGESTED',
      chunks_count: 0,
    };

    vi.spyOn(apiClient, 'apiFetch').mockResolvedValue(mockApiResponse);

    const adapter = new HttpKnowledgeAdapter();
    const result = await adapter.uploadDocument({
      tenantId: 'corp-acme',
      filename: 'seguridad.pdf',
      contentType: 'application/pdf',
      content: 'Contenido...',
    });

    expect(result.id).toBe('doc-999');
    expect(result.status).toBe('INGESTED');
    expect(result.isProcessing).toBe(true);
  });

  it('queries document status and returns updated INDEXED entity', async () => {
    const mockStatusResponse = {
      document_id: 'doc-999',
      filename: 'seguridad.pdf',
      status: 'INDEXED',
      chunks_count: 6,
      indexed_at: '2026-10-05T22:30:10Z',
    };

    vi.spyOn(apiClient, 'apiFetch').mockResolvedValue(mockStatusResponse);

    const adapter = new HttpKnowledgeAdapter();
    const result = await adapter.getDocumentStatus('corp-acme', 'doc-999');

    expect(result.status).toBe('INDEXED');
    expect(result.chunksCount).toBe(6);
    expect(result.indexedAt).toBeInstanceOf(Date);
  });
});
