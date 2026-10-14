import { describe, it, expect } from 'vitest';
import { GovernanceMetrics } from './GovernanceMetrics';

describe('GovernanceMetrics Entity', () => {
  it('instantiates valid governance metrics with proper getters', () => {
    const metrics = new GovernanceMetrics({
      totalIncidents: 42,
      blockedJailbreaks: 28,
      piiRedactedCount: 14,
      averageRiskScore: 0.88,
      inspectionLatencyP99Ms: 8.42,
    });

    expect(metrics.totalIncidents).toBe(42);
    expect(metrics.blockedJailbreaks).toBe(28);
    expect(metrics.piiRedactedCount).toBe(14);
    expect(metrics.averageRiskScore).toBe(0.88);
    expect(metrics.formattedAverageRisk).toBe('88%');
    expect(metrics.inspectionLatencyP99Ms).toBe(8.42);
    expect(metrics.formattedLatency).toBe('8.4ms');
    expect(metrics.mitigationRate).toBe(100);
  });

  it('handles zero incidents gracefully', () => {
    const metrics = new GovernanceMetrics({
      totalIncidents: 0,
      blockedJailbreaks: 0,
      piiRedactedCount: 0,
      averageRiskScore: 0,
      inspectionLatencyP99Ms: 4.1,
    });

    expect(metrics.mitigationRate).toBe(100);
    expect(metrics.formattedAverageRisk).toBe('0%');
    expect(metrics.formattedLatency).toBe('4.1ms');
  });

  it('clamps negative values to zero', () => {
    const metrics = new GovernanceMetrics({
      totalIncidents: -5,
      blockedJailbreaks: -2,
      piiRedactedCount: -1,
      averageRiskScore: -0.5,
      inspectionLatencyP99Ms: -3,
    });

    expect(metrics.totalIncidents).toBe(0);
    expect(metrics.blockedJailbreaks).toBe(0);
    expect(metrics.piiRedactedCount).toBe(0);
    expect(metrics.averageRiskScore).toBe(0);
    expect(metrics.inspectionLatencyP99Ms).toBe(0);
  });
});
