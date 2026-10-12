import { describe, it, expect } from 'vitest';
import { ConversationId } from './ConversationId';

describe('ConversationId Value Object', () => {
  it('creates valid ConversationId from non-empty string', () => {
    const id = ConversationId.create('conv-cloud-123');
    expect(id.value).toBe('conv-cloud-123');
  });

  it('normalizes whitespace', () => {
    const id = ConversationId.create('   conv-456   ');
    expect(id.value).toBe('conv-456');
  });

  it('throws error for empty string', () => {
    expect(() => ConversationId.create('')).toThrow();
    expect(() => ConversationId.create('   ')).toThrow();
  });

  it('compares equality correctly', () => {
    const id1 = ConversationId.create('conv-1');
    const id2 = ConversationId.create('conv-1');
    const id3 = ConversationId.create('conv-2');

    expect(id1.equals(id2)).toBe(true);
    expect(id1.equals(id3)).toBe(false);
  });
});
