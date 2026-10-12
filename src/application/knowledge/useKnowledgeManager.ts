import { useState, useEffect, useCallback } from 'react';
import { KnowledgeGateway } from '@/domain/knowledge/KnowledgeGateway';
import { KnowledgeDocument } from '@/domain/knowledge/KnowledgeDocument';
import { Citation } from '@/domain/knowledge/Citation';
import { useTenant } from '@/application/tenants/TenantContext';
import { MockKnowledgeGateway } from '@/infrastructure/api/MockKnowledgeGateway';
import { HttpKnowledgeAdapter } from '@/infrastructure/api/HttpKnowledgeAdapter';

export interface UseKnowledgeManagerOptions {
  tenantId?: string;
  gateway?: KnowledgeGateway;
}

export interface UploadPayload {
  name: string;
  type: string;
  content: string;
  sizeFormatted?: string;
}

const defaultGateway: KnowledgeGateway =
  process.env.NEXT_PUBLIC_USE_MOCKS !== 'false'
    ? new MockKnowledgeGateway()
    : new HttpKnowledgeAdapter();

export function useKnowledgeManager(options: UseKnowledgeManagerOptions = {}) {
  let sessionTenantId = 'corp-acme';
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const tenantCtx = useTenant();
    if (tenantCtx?.activeTenant?.id.value) {
      sessionTenantId = tenantCtx.activeTenant.id.value;
    }
  } catch {
    // Fallback if rendered outside TenantProvider
  }

  const tenantId = options.tenantId || sessionTenantId;
  const gateway = options.gateway || defaultGateway;

  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await gateway.listDocuments(tenantId);
      setDocuments(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar documentos';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [gateway, tenantId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Polling for any document in INGESTED state
  useEffect(() => {
    const ingestedDocs = documents.filter((d) => d.status === 'INGESTED');
    if (ingestedDocs.length === 0) return;

    const timer = setInterval(async () => {
      for (const doc of ingestedDocs) {
        try {
          const updated = await gateway.getDocumentStatus(tenantId, doc.id);
          setDocuments((prev) =>
            prev.map((item) => (item.id === doc.id ? updated : item))
          );
        } catch {
          // ignore transient poll error
        }
      }
    }, 1500);

    return () => clearInterval(timer);
  }, [documents, gateway, tenantId]);

  const uploadDocument = useCallback(
    async (file: UploadPayload): Promise<KnowledgeDocument> => {
      try {
        setIsUploading(true);
        setError(null);

        const newDoc = await gateway.uploadDocument({
          tenantId,
          filename: file.name,
          contentType: file.type,
          content: file.content,
          fileSizeFormatted: file.sizeFormatted || '320 KB',
        });

        setDocuments((prev) => {
          if (prev.some((d) => d.id === newDoc.id)) {
            return prev.map((d) => (d.id === newDoc.id ? newDoc : d));
          }
          return [newDoc, ...prev];
        });

        return newDoc;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al subir documento';
        setError(msg);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [gateway, tenantId]
  );

  const deleteDocument = useCallback(
    async (documentId: string): Promise<void> => {
      if (!gateway.deleteDocument) return;
      try {
        await gateway.deleteDocument(tenantId, documentId);
        setDocuments((prev) => prev.filter((d) => d.id !== documentId));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al eliminar documento';
        setError(msg);
      }
    },
    [gateway, tenantId]
  );

  return {
    documents,
    isLoading,
    isUploading,
    error,
    selectedCitation,
    setSelectedCitation,
    uploadDocument,
    deleteDocument,
    refresh: loadDocuments,
  };
}
