export class ConversationId {
  private constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error("ConversationId no puede estar vacío.");
    }
  }

  public static create(value: string): ConversationId {
    return new ConversationId((value || '').trim());
  }

  public equals(other: ConversationId | null | undefined): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
