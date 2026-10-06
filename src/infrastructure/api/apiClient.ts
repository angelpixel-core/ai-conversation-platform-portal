import { tenantSessionStore } from '../storage/tenantSessionStore';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  // Inject active tenant if present and not already specified
  const activeTenantId = tenantSessionStore.getActiveTenantId();
  if (activeTenantId && !headers.has('X-Tenant-Id')) {
    headers.set('X-Tenant-Id', activeTenantId.value);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData?.detail) {
        errorMessage = errorData.detail;
      }
    } catch {
      // Use fallback error message
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}
