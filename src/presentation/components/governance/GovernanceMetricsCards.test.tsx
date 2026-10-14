import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GovernanceMetricsCards } from './GovernanceMetricsCards';
import { GovernanceMetrics } from '@/domain/governance/GovernanceMetrics';

describe('GovernanceMetricsCards Component', () => {
  it('renders all metrics with correct values and Neubrutalism cards', () => {
    const metrics = new GovernanceMetrics({
      totalIncidents: 42,
      blockedJailbreaks: 28,
      piiRedactedCount: 14,
      averageRiskScore: 0.88,
      inspectionLatencyP99Ms: 8.4,
    });

    render(<GovernanceMetricsCards metrics={metrics} />);

    expect(screen.getByText('Total Incidentes')).toBeDefined();
    expect(screen.getByText('42')).toBeDefined();
    expect(screen.getByText('Jailbreaks Bloqueados')).toBeDefined();
    expect(screen.getByText('28')).toBeDefined();
    expect(screen.getByText('PII Redactada')).toBeDefined();
    expect(screen.getByText('14')).toBeDefined();
    expect(screen.getByText('Latencia Guardrails (P99)')).toBeDefined();
    expect(screen.getByText('8.4ms')).toBeDefined();
    expect(screen.getByText(/Riesgo promedio: 88%/i)).toBeDefined();
  });

  it('renders zero values when metrics are null', () => {
    render(<GovernanceMetricsCards metrics={null} />);

    expect(screen.getAllByText('0')).toHaveLength(3);
    expect(screen.getByText('0.0ms')).toBeDefined();
  });
});
