import { describe, it, expect, beforeEach, vi } from 'vitest';
import { runtimeEnvironmentStore } from './runtimeEnvironmentStore';

describe('runtimeEnvironmentStore', () => {
  beforeEach(() => {
    runtimeEnvironmentStore.clear();
  });

  it('defaults to LIVE or environment preference', () => {
    const mode = runtimeEnvironmentStore.getMode();
    expect(mode === 'LIVE' || mode === 'MOCK').toBe(true);
  });

  it('sets and retrieves mode correctly', () => {
    runtimeEnvironmentStore.setMode('LIVE');
    expect(runtimeEnvironmentStore.getMode()).toBe('LIVE');

    runtimeEnvironmentStore.setMode('MOCK');
    expect(runtimeEnvironmentStore.getMode()).toBe('MOCK');
  });

  it('toggles mode between LIVE and MOCK', () => {
    runtimeEnvironmentStore.setMode('LIVE');
    const toggled = runtimeEnvironmentStore.toggleMode();
    expect(toggled).toBe('MOCK');
    expect(runtimeEnvironmentStore.getMode()).toBe('MOCK');

    const toggledBack = runtimeEnvironmentStore.toggleMode();
    expect(toggledBack).toBe('LIVE');
    expect(runtimeEnvironmentStore.getMode()).toBe('LIVE');
  });

  it('notifies subscribers on mode change', () => {
    const listener = vi.fn();
    const unsubscribe = runtimeEnvironmentStore.subscribe(listener);

    runtimeEnvironmentStore.setMode('MOCK');
    expect(listener).toHaveBeenCalledWith('MOCK');

    unsubscribe();
    runtimeEnvironmentStore.setMode('LIVE');
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
