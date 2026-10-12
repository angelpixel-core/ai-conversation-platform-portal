export type DocumentStatus = 'INGESTED' | 'INDEXED' | 'FAILED';

export class KnowledgeDocument {
  constructor(
    public readonly id: string,
    public readonly filename: string,
    public readonly contentType: string,
    public readonly status: DocumentStatus,
    public readonly chunksCount: number,
    public readonly createdAt: Date,
    public readonly indexedAt?: Date,
    public readonly errorReason?: string,
    public readonly fileSizeFormatted?: string
  ) {}

  get isProcessing(): boolean {
    return this.status === 'INGESTED';
  }

  get isIndexed(): boolean {
    return this.status === 'INDEXED';
  }

  get isFailed(): boolean {
    return this.status === 'FAILED';
  }

  withIndexed(chunksCount: number, indexedAt: Date = new Date()): KnowledgeDocument {
    return new KnowledgeDocument(
      this.id,
      this.filename,
      this.contentType,
      'INDEXED',
      chunksCount,
      this.createdAt,
      indexedAt,
      undefined,
      this.fileSizeFormatted
    );
  }

  withFailed(errorReason: string): KnowledgeDocument {
    return new KnowledgeDocument(
      this.id,
      this.filename,
      this.contentType,
      'FAILED',
      0,
      this.createdAt,
      undefined,
      errorReason,
      this.fileSizeFormatted
    );
  }
}
