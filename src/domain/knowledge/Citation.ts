export class Citation {
  constructor(
    public readonly sourceDocumentId: string,
    public readonly documentName: string,
    public readonly chunkId: string,
    public readonly similarityScore: number,
    public readonly snippet: string
  ) {}

  get formattedScore(): string {
    return `${Math.round(this.similarityScore * 100)}% relevancia`;
  }

  get isHighRelevance(): boolean {
    return this.similarityScore >= 0.85;
  }

  get truncatedSnippet(): string {
    if (this.snippet.length <= 140) {
      return this.snippet;
    }
    return this.snippet.substring(0, 140) + '...';
  }
}
