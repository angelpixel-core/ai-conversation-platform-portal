export class WorkflowId {
  private readonly _value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('WorkflowId cannot be empty');
    }
    this._value = value.trim();
  }

  get value(): string {
    return this._value;
  }

  equals(other: WorkflowId): boolean {
    return this._value === other.value;
  }

  toString(): string {
    return this._value;
  }
}
