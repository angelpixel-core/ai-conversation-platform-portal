import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpGuardrailsAdapter } from './HttpGuardrailsAdapter';
import * as apiClient from './apiClient';

describe('HttpGuardrailsAdapter', () => {
  let adapter: HttpGuardrailsAdapter;

  beforeEach(() => {
    vi.restoreAllMocks();
    adapter = new HttpGuardrailsAdapter();
  });

  it('fetches incidents via apiFetch and maps to domain entities', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockResolvedValueOnce([
      {
        incident_id: 'inc-live-10',
        tenant_id: 'corp-acme',
        violation_type: 'PROMPT_INJECTION',
        severity: 'CRITICAL',
        risk_score: 0.99,
        detected_pattern: 'ignore_instructions',
        redacted_snippet: 'Ignore instructions...',
        trace_id: '4bf92f3577b34da6a3ce929d0e0e4736',
        span_id: '00f067aa0ba902b7',
        created_at: '2026-10-14T10:00:00Z',
      },
    ]);

    const incidents = await adapter.getIncidents('corp-acme', 'CRITICAL');
    expect(incidents).toHaveLength(1);
    expect(incidents[0].id).toBe('inc-live-10');
    expect(incidents[0].formattedRisk).toBe('99%');
    expect(incidents[0].severity).toBe('CRITICAL');
  });

  it('fetches governance metrics via apiFetch and maps to GovernanceMetrics entity', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockResolvedValueOnce({
      total_incidents: 100,
      blocked_jailbreaks: 75,
      pii_redacted_count: 25,
      average_risk_score: 0.92,
      inspection_latency_p99_ms: 6.5,
    });

    const metrics = await adapter.getMetrics('corp-acme');
    expect(metrics.totalIncidents).toBe(100);
    expect(metrics.blockedJailbreaks).toBe(75);
    expect(metrics.formattedLatency).toBe('6.5ms');
    expect(metrics.formattedAverageRisk).toBe('92%');
  });

  it('falls back to MockGuardrailsGateway on apiFetch failure', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockRejectedValueOnce(new Error('Connection refused 500'));

    const fallbackIncidents = await adapter.getIncidents('corp-acme');
    expect(fallbackIncidents.length).toBeGreaterThan(0);
    expect(fallbackIncidents[0].tenantId).toBe('corp-acme');
  });
});
