import { describe, it, expect, vi } from 'vitest';
import { MockStreamingGateway } from './MockStreamingGateway';

describe('MockStreamingGateway (Infrastructure)', () => {
  it('streams tokens sequentially and calls onDone', async () => {
    const gateway = new MockStreamingGateway({ tokenDelayMs: 5 });
    const tokens: { sequenceId: number; text: string }[] = [];
    let isDone = false;

    await gateway.openStream('conv-1', 'corp-acme', null, {
      onToken: (tok) => tokens.push(tok),
      onDone: () => {
        isDone = true;
      },
      onError: vi.fn(),
    });

    expect(tokens.length).toBeGreaterThan(5);
    expect(tokens[0].sequenceId).toBe(1);
    expect(tokens[1].sequenceId).toBe(2);
    expect(isDone).toBe(true);
  });

  it('simulates network drop at configured sequence and triggers onError', async () => {
    const gateway = new MockStreamingGateway({
      tokenDelayMs: 5,
      dropAtSequence: 4,
    });
    const tokens: { sequenceId: number; text: string }[] = [];
    let isDone = false;
    let receivedError: Error | null = null;

    await gateway.openStream('conv-1', 'corp-acme', null, {
      onToken: (tok) => tokens.push(tok),
      onDone: () => {
        isDone = true;
      },
      onError: (err) => {
        receivedError = err;
      },
    });

    expect(tokens.length).toBe(4);
    expect(tokens[tokens.length - 1].sequenceId).toBe(4);
    expect(isDone).toBe(false);
    expect(receivedError).not.toBeNull();
    expect(receivedError?.message).toContain('Simulated network drop');
  });

  it('resumes streaming from lastEventId without re-emitting previous tokens', async () => {
    const gateway = new MockStreamingGateway({ tokenDelayMs: 5 });
    const resumedTokens: { sequenceId: number; text: string }[] = [];
    let isDone = false;

    await gateway.openStream('conv-1', 'corp-acme', 4, {
      onToken: (tok) => resumedTokens.push(tok),
      onDone: () => {
        isDone = true;
      },
      onError: vi.fn(),
    });

    expect(resumedTokens[0].sequenceId).toBe(5);
    expect(isDone).toBe(true);
  });
});
