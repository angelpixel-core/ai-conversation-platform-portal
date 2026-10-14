import { describe, it, expect, beforeEach } from 'vitest';
import { MockGuardrailsGateway } from './MockGuardrailsGateway';

describe('MockGuardrailsGateway', () => {
  let gateway: MockGuardrailsGateway;

  beforeEach(() => {
    gateway = new MockGuardrailsGateway();
  });

  it('returns seeded incidents for the specified tenant', async () => {
    const incidents = await gateway.getIncidents('corp-acme');
    expect(incidents.length).toBe(5);
    expect(incidents[0].id).toBe('inc-9821a');
    expect(incidents[0].violationType).toBe('PROMPT_INJECTION');
  });

  it('filters incidents by severity', async () => {
    const criticals = await gateway.getIncidents('corp-acme', 'CRITICAL');
    expect(criticals.length).toBe(2);
    expect(criticals.every(i => i.severity === 'CRITICAL')).toBe(true);

    const highs = await gateway.getIncidents('corp-acme', 'HIGH');
    expect(highs.length).toBe(1);
    expect(highs[0].severity).toBe('HIGH');
  });

  it('computes initial governance metrics accurately', async () => {
    const metrics = await gateway.getMetrics('corp-acme');
    expect(metrics.totalIncidents).toBe(5);
    expect(metrics.blockedJailbreaks).toBe(2);
    expect(metrics.piiRedactedCount).toBe(2);
    expect(metrics.inspectionLatencyP99Ms).toBe(8.4);
  });

  it('simulates prompt injection attack and updates metrics and list', async () => {
    const simulated = await gateway.simulateAttack('corp-acme', 'PROMPT_INJECTION');
    expect(simulated.violationType).toBe('PROMPT_INJECTION');
    expect(simulated.severity).toBe('CRITICAL');
    expect(simulated.traceId).toBeDefined();

    const updatedIncidents = await gateway.getIncidents('corp-acme');
    expect(updatedIncidents.length).toBe(6);
    expect(updatedIncidents[0].id).toBe(simulated.id);

    const updatedMetrics = await gateway.getMetrics('corp-acme');
    expect(updatedMetrics.totalIncidents).toBe(6);
    expect(updatedMetrics.blockedJailbreaks).toBe(3);
  });

  it('simulates PII leak attack correctly', async () => {
    const simulated = await gateway.simulateAttack('corp-acme', 'PII_LEAK');
    expect(simulated.violationType).toBe('PII_LEAK');
    expect(simulated.severity).toBe('HIGH');

    const updatedMetrics = await gateway.getMetrics('corp-acme');
    expect(updatedMetrics.piiRedactedCount).toBe(3);
  });
});
