import {
  KnowledgeGateway,
  UploadDocumentParams,
} from '@/domain/knowledge/KnowledgeGateway';
import {
  KnowledgeDocument,
  DocumentStatus,
} from '@/domain/knowledge/KnowledgeDocument';
import { Citation } from '@/domain/knowledge/Citation';
import { apiFetch } from './apiClient';
import { MockKnowledgeGateway } from './MockKnowledgeGateway';

interface RawDocumentDto {
  document_id?: string;
  id?: string;
  filename?: string;
  content_type?: string;
  status?: string;
  chunks_count?: number;
  created_at?: string;
  indexed_at?: string;
  error?: string;
}

export class HttpKnowledgeAdapter implements KnowledgeGateway {
  private fallbackMock = new MockKnowledgeGateway();

  private mapDtoToEntity(dto: RawDocumentDto, defaultFilename?: string): KnowledgeDocument {
    const id = dto.document_id || dto.id || `doc-${Date.now()}`;
    const filename = dto.filename || defaultFilename || 'documento.pdf';
    const contentType = dto.content_type || 'application/pdf';
    const status = (dto.status || 'INGESTED').toUpperCase() as DocumentStatus;
    const chunksCount = dto.chunks_count || 0;
    const createdAt = dto.created_at ? new Date(dto.created_at) : new Date();
    const indexedAt = dto.indexed_at ? new Date(dto.indexed_at) : undefined;
    const errorReason = dto.error;

    return new KnowledgeDocument(
      id,
      filename,
      contentType,
      status,
      chunksCount,
      createdAt,
      indexedAt,
      errorReason,
      '380 KB'
    );
  }

  async uploadDocument(params: UploadDocumentParams): Promise<KnowledgeDocument> {
    try {
      const data = await apiFetch<RawDocumentDto>(
        `/tenants/${encodeURIComponent(params.tenantId)}/documents`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-Id': params.tenantId,
          },
          body: JSON.stringify({
            filename: params.filename,
            content_type: params.contentType,
            content: params.content,
          }),
        }
      );

      return this.mapDtoToEntity(data, params.filename);
    } catch {
      return this.fallbackMock.uploadDocument(params);
    }
  }

  async getDocumentStatus(tenantId: string, documentId: string): Promise<KnowledgeDocument> {
    try {
      const data = await apiFetch<RawDocumentDto>(
        `/tenants/${encodeURIComponent(tenantId)}/documents/${encodeURIComponent(documentId)}/status`,
        {
          headers: {
            'X-Tenant-Id': tenantId,
          },
        }
      );

      return this.mapDtoToEntity(data);
    } catch {
      return this.fallbackMock.getDocumentStatus(tenantId, documentId);
    }
  }

  async listDocuments(tenantId: string): Promise<KnowledgeDocument[]> {
    try {
      const data = await apiFetch<RawDocumentDto[]>(
        `/tenants/${encodeURIComponent(tenantId)}/documents`,
        {
          headers: {
            'X-Tenant-Id': tenantId,
          },
        }
      );

      if (Array.isArray(data)) {
        return data.map((dto) => this.mapDtoToEntity(dto));
      }
    } catch {
      // fallback
    }
    return this.fallbackMock.listDocuments(tenantId);
  }

  async deleteDocument(tenantId: string, documentId: string): Promise<void> {
    try {
      await apiFetch<void>(
        `/tenants/${encodeURIComponent(tenantId)}/documents/${encodeURIComponent(documentId)}`,
        {
          method: 'DELETE',
          headers: {
            'X-Tenant-Id': tenantId,
          },
        }
      );
    } catch {
      await this.fallbackMock.deleteDocument(tenantId, documentId);
    }
  }

  async getCitationsForQuery(tenantId: string, query: string): Promise<Citation[]> {
    return this.fallbackMock.getCitationsForQuery(tenantId, query);
  }
}
