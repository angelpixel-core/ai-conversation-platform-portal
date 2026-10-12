import { describe, it, expect } from 'vitest';
import { MockKnowledgeGateway } from './MockKnowledgeGateway';

describe('MockKnowledgeGateway Infrastructure', () => {
  it('returns initial seeded documents for a tenant', async () => {
    const gateway = new MockKnowledgeGateway();
    const docs = await gateway.listDocuments('corp-acme');

    expect(docs.length).toBeGreaterThanOrEqual(3);
    expect(docs[0].isIndexed).toBe(true);
    expect(docs[0].filename).toBe('politica_seguridad_2026.pdf');
  });

  it('uploads a new document in INGESTED state (HTTP 202 simulation)', async () => {
    const gateway = new MockKnowledgeGateway();
    const newDoc = await gateway.uploadDocument({
      tenantId: 'corp-acme',
      filename: 'guia_tostado_especialidad.pdf',
      contentType: 'application/pdf',
      content: 'Contenido del manual de perfiles de tueste y curvas termodinámicas.',
      fileSizeFormatted: '480 KB',
    });

    expect(newDoc.status).toBe('INGESTED');
    expect(newDoc.chunksCount).toBe(0);

    const list = await gateway.listDocuments('corp-acme');
    expect(list.find((d) => d.id === newDoc.id)).toBeDefined();
  });

  it('progresses document from INGESTED to INDEXED when queried for status', async () => {
    const gateway = new MockKnowledgeGateway();
    const uploaded = await gateway.uploadDocument({
      tenantId: 'corp-acme',
      filename: 'control_calidad.docx',
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      content: 'Parámetros de control de calidad de granos verdes.',
      fileSizeFormatted: '120 KB',
    });

    // Simulating worker indexing
    const statusDoc = await gateway.getDocumentStatus('corp-acme', uploaded.id);
    expect(statusDoc.status).toBe('INDEXED');
    expect(statusDoc.chunksCount).toBeGreaterThan(0);
    expect(statusDoc.indexedAt).toBeInstanceOf(Date);
  });

  it('provides verified citations for hybrid search queries', async () => {
    const gateway = new MockKnowledgeGateway();
    const citations = await gateway.getCitationsForQuery('corp-acme', 'temperatura del agua para espresso');

    expect(citations.length).toBeGreaterThan(0);
    expect(citations[0].documentName).toBeDefined();
    expect(citations[0].similarityScore).toBeGreaterThan(0.7);
  });
});
