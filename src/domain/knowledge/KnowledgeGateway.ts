import { KnowledgeDocument } from './KnowledgeDocument';
import { Citation } from './Citation';

export interface UploadDocumentParams {
  tenantId: string;
  filename: string;
  contentType: string;
  content: string;
  fileSizeFormatted?: string;
}

export interface KnowledgeGateway {
  uploadDocument(params: UploadDocumentParams): Promise<KnowledgeDocument>;
  getDocumentStatus(tenantId: string, documentId: string): Promise<KnowledgeDocument>;
  listDocuments(tenantId: string): Promise<KnowledgeDocument[]>;
  deleteDocument?(tenantId: string, documentId: string): Promise<void>;
  getCitationsForQuery?(tenantId: string, query: string): Promise<Citation[]>;
}
