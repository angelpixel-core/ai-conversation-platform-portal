import { HealthMode } from '@/domain/health/SystemHealth';

const STORAGE_KEY = 'chatbot_portal_env_mode';

type Listener = (mode: HealthMode) => void;

class RuntimeEnvironmentStore {
  private inMemoryMode: HealthMode | null = null;
  private listeners: Set<Listener> = new Set();

  getMode(): HealthMode {
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored === 'LIVE' || stored === 'MOCK') {
          return stored;
        }
      } catch {
        // Fallback to in-memory mode if sessionStorage is restricted
      }
    }

    if (this.inMemoryMode) {
      return this.inMemoryMode;
    }

    // Default based on environment variable; if not defined or false, default to LIVE
    return process.env.NEXT_PUBLIC_USE_MOCKS === 'true' ? 'MOCK' : 'LIVE';
  }

  setMode(mode: HealthMode): void {
    this.inMemoryMode = mode;
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(STORAGE_KEY, mode);
      } catch {
        // Ignore storage exceptions
      }
    }
    this.notify();
  }

  toggleMode(): HealthMode {
    const current = this.getMode();
    const next = current === 'LIVE' ? 'MOCK' : 'LIVE';
    this.setMode(next);
    return next;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const currentMode = this.getMode();
    this.listeners.forEach((listener) => {
      try {
        listener(currentMode);
      } catch {
        // Ignore listener exceptions
      }
    });
  }

  clear(): void {
    this.inMemoryMode = null;
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
    this.notify();
  }
}

export const runtimeEnvironmentStore = new RuntimeEnvironmentStore();
