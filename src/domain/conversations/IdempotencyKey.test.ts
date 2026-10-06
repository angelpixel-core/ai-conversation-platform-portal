import { describe, it, expect } from 'vitest';
import { IdempotencyKey } from './IdempotencyKey';

describe('IdempotencyKey Value Object', () => {
  it('generates a valid UUIDv4 idempotency key', () => {
    const key = IdempotencyKey.generate();
    expect(key.value).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('instantiates from an existing valid UUIDv4', () => {
    const raw = 'f059fa8f-6ef0-437f-9e9e-4d41a9ded399';
    const key = IdempotencyKey.from(raw);
    expect(key.value).toBe(raw);
  });

  it('throws an error when instantiated with an invalid UUID string', () => {
    expect(() => IdempotencyKey.from('not-a-uuid')).toThrow();
    expect(() => IdempotencyKey.from('')).toThrow();
  });

  it('compares equality with other IdempotencyKey instances', () => {
    const raw = 'f059fa8f-6ef0-437f-9e9e-4d41a9ded399';
    const key1 = IdempotencyKey.from(raw);
    const key2 = IdempotencyKey.from(raw);
    const key3 = IdempotencyKey.generate();

    expect(key1.equals(key2)).toBe(true);
    expect(key1.equals(key3)).toBe(false);
  });
});
