export class IdempotencyKey {
  private static readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  private constructor(public readonly value: string) {
    if (!IdempotencyKey.UUID_REGEX.test(value)) {
      throw new Error(`IdempotencyKey inválida: '${value}'. Debe ser un UUIDv4.`);
    }
  }

  public static generate(): IdempotencyKey {
    return new IdempotencyKey(crypto.randomUUID());
  }

  public static from(value: string): IdempotencyKey {
    return new IdempotencyKey(value);
  }

  public equals(other: IdempotencyKey | null | undefined): boolean {
    if (!other) return false;
    return this.value.toLowerCase() === other.value.toLowerCase();
  }

  public toString(): string {
    return this.value;
  }
}
