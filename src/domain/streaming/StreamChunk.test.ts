import { describe, it, expect } from 'vitest';
import { StreamChunk } from './StreamChunk';

describe('StreamChunk Value Object', () => {
  it('creates a valid StreamChunk with sequenceId and text', () => {
    const chunk = new StreamChunk({
      sequenceId: 1,
      text: 'La ',
      isDone: false,
    });

    expect(chunk.sequenceId).toBe(1);
    expect(chunk.text).toBe('La ');
    expect(chunk.isDone).toBe(false);
    expect(chunk.timestamp).toBeInstanceOf(Date);
  });

  it('recognizes a terminal [DONE] chunk', () => {
    const chunk = new StreamChunk({
      sequenceId: 10,
      text: '',
      isDone: true,
    });

    expect(chunk.isDone).toBe(true);
    expect(chunk.text).toBe('');
  });

  it('throws an error if sequenceId is negative', () => {
    expect(() => {
      new StreamChunk({
        sequenceId: -1,
        text: 'token',
      });
    }).toThrow('Sequence ID must be a non-negative integer');
  });

  it('determines equality based on sequenceId and text', () => {
    const chunk1 = new StreamChunk({ sequenceId: 3, text: 'de ' });
    const chunk2 = new StreamChunk({ sequenceId: 3, text: 'de ' });
    const chunk3 = new StreamChunk({ sequenceId: 4, text: 'de ' });

    expect(chunk1.equals(chunk2)).toBe(true);
    expect(chunk1.equals(chunk3)).toBe(false);
  });
});
