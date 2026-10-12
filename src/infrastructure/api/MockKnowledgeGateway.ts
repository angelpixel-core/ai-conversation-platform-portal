import {
  KnowledgeGateway,
  UploadDocumentParams,
} from '@/domain/knowledge/KnowledgeGateway';
import { KnowledgeDocument } from '@/domain/knowledge/KnowledgeDocument';
import { Citation } from '@/domain/knowledge/Citation';

export class MockKnowledgeGateway implements KnowledgeGateway {
  private documentsByTenant: Map<string, KnowledgeDocument[]> = new Map();

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData(): void {
    const defaultDocs: KnowledgeDocument[] = [
      new KnowledgeDocument(
        'doc-5128a3f1-4b10-4c8d-81e0-a7bb5001d100',
        'politica_seguridad_2026.pdf',
        'application/pdf',
        'INDEXED',
        8,
        new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
        new Date(Date.now() - 1000 * 60 * 60 * 24 * 3 + 12000),
        undefined,
        '342 KB'
      ),
      new KnowledgeDocument(
        'doc-7819c402-9912-4011-81e0-b7cc99214480',
        'manual_operaciones_barista.pdf',
        'application/pdf',
        'INDEXED',
        14,
        new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        new Date(Date.now() - 1000 * 60 * 60 * 24 + 18000),
        undefined,
        '1.2 MB'
      ),
      new KnowledgeDocument(
        'doc-9914b100-3321-4822-9011-c8dd11200991',
        'recetas_especialidad_otono.docx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'INDEXED',
        5,
        new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
        new Date(Date.now() - 1000 * 60 * 60 * 4 + 9000),
        undefined,
        '510 KB'
      ),
    ];

    this.documentsByTenant.set('corp-acme', [...defaultDocs]);
    this.documentsByTenant.set('tenant-acme', [...defaultDocs]);
    this.documentsByTenant.set('default', [...defaultDocs]);
  }

  private getList(tenantId: string): KnowledgeDocument[] {
    if (!this.documentsByTenant.has(tenantId)) {
      this.seedDefaultData();
      return this.documentsByTenant.get('corp-acme') || [];
    }
    return this.documentsByTenant.get(tenantId)!;
  }

  async listDocuments(tenantId: string): Promise<KnowledgeDocument[]> {
    const list = this.getList(tenantId);
    return [...list];
  }

  async uploadDocument(params: UploadDocumentParams): Promise<KnowledgeDocument> {
    const list = this.getList(params.tenantId);
    const newDocId = `doc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;

    const newDoc = new KnowledgeDocument(
      newDocId,
      params.filename,
      params.contentType,
      'INGESTED',
      0,
      new Date(),
      undefined,
      undefined,
      params.fileSizeFormatted || '256 KB'
    );

    list.unshift(newDoc);
    this.documentsByTenant.set(params.tenantId, list);
    return newDoc;
  }

  async getDocumentStatus(tenantId: string, documentId: string): Promise<KnowledgeDocument> {
    const list = this.getList(tenantId);
    const index = list.findIndex((d) => d.id === documentId);

    if (index === -1) {
      throw new Error(`Document with ID ${documentId} not found`);
    }

    const current = list[index];

    // If still ingested, progress to INDEXED
    if (current.status === 'INGESTED') {
      const indexed = current.withIndexed(6, new Date());
      list[index] = indexed;
      this.documentsByTenant.set(tenantId, list);
      return indexed;
    }

    return current;
  }

  async deleteDocument(tenantId: string, documentId: string): Promise<void> {
    const list = this.getList(tenantId);
    const filtered = list.filter((d) => d.id !== documentId);
    this.documentsByTenant.set(tenantId, filtered);
  }

  async getCitationsForQuery(tenantId: string, query: string): Promise<Citation[]> {
    return [
      new Citation(
        'doc-7819c402-9912-4011-81e0-b7cc99214480',
        'manual_operaciones_barista.pdf',
        'chunk-4',
        0.93,
        `Para una extracción óptima de espresso doble, la temperatura del agua en el grupo térmico debe mantenerse estrictamente entre 92°C y 94°C a 9 bares de presión barométrica.`
      ),
      new Citation(
        'doc-5128a3f1-4b10-4c8d-81e0-a7bb5001d100',
        'politica_seguridad_2026.pdf',
        'chunk-2',
        0.87,
        `El acceso a los parámetros de calibración de las máquinas de café en la red IoT corporativa requiere autenticación mTLS y validación de tenant.`
      ),
    ];
  }
}
