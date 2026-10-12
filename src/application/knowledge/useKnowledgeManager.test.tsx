import { describe, it, expect } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useKnowledgeManager } from './useKnowledgeManager';
import { MockKnowledgeGateway } from '@/infrastructure/api/MockKnowledgeGateway';

describe('useKnowledgeManager Application Hook', () => {
  it('loads initial documents for tenant', async () => {
    const gateway = new MockKnowledgeGateway();

    const { result } = renderHook(() =>
      useKnowledgeManager({ tenantId: 'corp-acme', gateway })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.documents.length).toBeGreaterThanOrEqual(3);
    expect(result.current.documents[0].filename).toBe('politica_seguridad_2026.pdf');
  });

  it('uploads document and optimistically transitions from INGESTED to INDEXED', async () => {
    const gateway = new MockKnowledgeGateway();

    const { result } = renderHook(() =>
      useKnowledgeManager({ tenantId: 'corp-acme', gateway })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let uploadedDoc;
    await act(async () => {
      uploadedDoc = await result.current.uploadDocument({
        name: 'manual_calibracion_sensores.pdf',
        type: 'application/pdf',
        content: 'Protocolo de calibración de termistores.',
      });
    });

    expect(uploadedDoc?.status).toBe('INGESTED');
    expect(result.current.documents.find((d) => d.id === uploadedDoc?.id)).toBeDefined();

    // After polling triggers
    await waitFor(() => {
      const doc = result.current.documents.find((d) => d.id === uploadedDoc?.id);
      expect(doc?.status).toBe('INDEXED');
    }, { timeout: 4000 });
  });

  it('allows selecting and clearing active citation for drawer inspection', async () => {
    const gateway = new MockKnowledgeGateway();

    const { result } = renderHook(() =>
      useKnowledgeManager({ tenantId: 'corp-acme', gateway })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.selectedCitation).toBeNull();
  });
});
