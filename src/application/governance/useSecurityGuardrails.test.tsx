import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSecurityGuardrails } from './useSecurityGuardrails';
import { MockGuardrailsGateway } from '@/infrastructure/api/MockGuardrailsGateway';

describe('useSecurityGuardrails Hook', () => {
  let gateway: MockGuardrailsGateway;

  beforeEach(() => {
    gateway = new MockGuardrailsGateway();
  });

  it('loads incidents and governance metrics on mount', async () => {
    const { result } = renderHook(() =>
      useSecurityGuardrails({
        tenantId: 'corp-acme',
        gateway,
      })
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.incidents.length).toBe(5);
    expect(result.current.metrics?.totalIncidents).toBe(5);
    expect(result.current.metrics?.blockedJailbreaks).toBe(2);
    expect(result.current.error).toBeNull();
  });

  it('filters incidents by severity reactively', async () => {
    const { result } = renderHook(() =>
      useSecurityGuardrails({
        tenantId: 'corp-acme',
        gateway,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setSeverityFilter('CRITICAL');
    });

    await waitFor(() => {
      expect(result.current.severityFilter).toBe('CRITICAL');
      expect(result.current.incidents.length).toBe(2);
      expect(result.current.incidents.every(i => i.severity === 'CRITICAL')).toBe(true);
    });
  });

  it('simulates an attack, creates active alert banner and updates metrics', async () => {
    const { result } = renderHook(() =>
      useSecurityGuardrails({
        tenantId: 'corp-acme',
        gateway,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let incident;
    await act(async () => {
      incident = await result.current.simulateAttack('PROMPT_INJECTION');
    });

    expect(incident).toBeDefined();
    expect(result.current.activeAlert?.id).toBe(incident?.id);
    expect(result.current.incidents.length).toBe(6);
    expect(result.current.metrics?.blockedJailbreaks).toBe(3);

    // Dismiss alert
    act(() => {
      result.current.dismissAlert();
    });
    expect(result.current.activeAlert).toBeNull();
  });

  it('manages trace selection for modal inspection', async () => {
    const { result } = renderHook(() =>
      useSecurityGuardrails({
        tenantId: 'corp-acme',
        gateway,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const targetIncident = result.current.incidents[0];
    act(() => {
      result.current.selectTrace(targetIncident);
    });

    expect(result.current.selectedTraceIncident?.id).toBe(targetIncident.id);

    act(() => {
      result.current.selectTrace(null);
    });

    expect(result.current.selectedTraceIncident).toBeNull();
  });
});
