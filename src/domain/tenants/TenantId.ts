export class TenantId {
  private static readonly SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  private constructor(public readonly value: string) {
    if (!TenantId.SLUG_REGEX.test(value)) {
      throw new Error(`TenantId inválido: '${value}'. Debe ser un slug en minúsculas y caracteres alfanuméricos con guiones.`);
    }
  }

  public static create(value: string): TenantId {
    const normalized = (value || '').trim().toLowerCase();
    return new TenantId(normalized);
  }

  public equals(other: TenantId | null | undefined): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
