import { describe, it, expect } from 'vitest';
import { SystemHealth, HealthStatusLevel, ComponentHealthCheck } from './SystemHealth';

describe('SystemHealth (Domain Entity)', () => {
  it('should instantiate correctly with valid properties', () => {
    const components: ComponentHealthCheck[] = [
      { name: 'mssql', status: 'HEALTHY', latencyMs: 4 },
      { name: 'rabbitmq', status: 'HEALTHY', latencyMs: 2 },
    ];
    const checkedAt = new Date();

    const health = new SystemHealth('HEALTHY', 45, checkedAt, components, {
      mode: 'LIVE',
      rawPayload: { status: 'ok' },
      serverVersion: '1.0.0',
      isRFC31Compliant: false,
    });

    expect(health.status).toBe('HEALTHY');
    expect(health.latencyMs).toBe(45);
    expect(health.checkedAt).toBe(checkedAt);
    expect(health.components).toHaveLength(2);
    expect(health.mode).toBe('LIVE');
    expect(health.rawPayload).toEqual({ status: 'ok' });
    expect(health.serverVersion).toBe('1.0.0');
    expect(health.isRFC31Compliant).toBe(false);
  });

  it('should evaluate latencyQuality and latencyQualityColor correctly', () => {
    const excellent = new SystemHealth('HEALTHY', 24, new Date());
    expect(excellent.latencyQuality).toBe('EXCELLENT');
    expect(excellent.latencyQualityColor).toBe('#10B981');

    const good = new SystemHealth('HEALTHY', 120, new Date());
    expect(good.latencyQuality).toBe('GOOD');
    expect(good.latencyQualityColor).toBe('#F59E0B');

    const poor = new SystemHealth('DEGRADED', 350, new Date());
    expect(poor.latencyQuality).toBe('POOR');
    expect(poor.latencyQualityColor).toBe('#EF4444');

    const down = new SystemHealth('DOWN', 0, new Date());
    expect(down.latencyQuality).toBe('POOR');
    expect(down.latencyQualityColor).toBe('#EF4444');
  });

  it('should return isOperational true for HEALTHY and DEGRADED statuses', () => {
    const healthy = new SystemHealth('HEALTHY', 30, new Date());
    const degraded = new SystemHealth('DEGRADED', 450, new Date());
    const down = new SystemHealth('DOWN', 0, new Date());
    const checking = new SystemHealth('CHECKING', 0, new Date());

    expect(healthy.isOperational).toBe(true);
    expect(degraded.isOperational).toBe(true);
    expect(down.isOperational).toBe(false);
    expect(checking.isOperational).toBe(false);
  });

  it('should return correct Neubrutalism brand colors for each status level', () => {
    const healthy = new SystemHealth('HEALTHY', 20, new Date());
    const degraded = new SystemHealth('DEGRADED', 20, new Date());
    const down = new SystemHealth('DOWN', 20, new Date());
    const checking = new SystemHealth('CHECKING', 20, new Date());

    expect(healthy.statusColor).toBe('#10B981'); // Emerald 500
    expect(degraded.statusColor).toBe('#F59E0B'); // Amber 500
    expect(down.statusColor).toBe('#EF4444'); // Red 500
    expect(checking.statusColor).toBe('#64748B'); // Slate 500
  });

  it('should support checking individual component checks (RFC-01)', () => {
    const components: ComponentHealthCheck[] = [
      { name: 'mssql', status: 'HEALTHY', latencyMs: 5, database: 'ChatbotDB' },
      { name: 'rabbitmq', status: 'DEGRADED', message: 'Queue latency above threshold' },
    ];
    const health = new SystemHealth('DEGRADED', 120, new Date(), components);

    const mssqlCheck = health.getComponentCheck('mssql');
    const rmqCheck = health.getComponentCheck('rabbitmq');
    const unknownCheck = health.getComponentCheck('unknown');

    expect(mssqlCheck?.status).toBe('HEALTHY');
    expect(rmqCheck?.status).toBe('DEGRADED');
    expect(unknownCheck).toBeUndefined();
  });
});
