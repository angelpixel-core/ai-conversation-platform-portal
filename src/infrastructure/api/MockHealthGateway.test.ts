import { describe, it, expect } from 'vitest';
import { MockHealthGateway } from './MockHealthGateway';

describe('MockHealthGateway (In-Memory Gateway Pattern)', () => {
  it('should return default healthy state with simulated in-memory latency and RFC-01 components', async () => {
    const gateway = new MockHealthGateway();
    const health = await gateway.getHealth();

    expect(health.status).toBe('HEALTHY');
    expect(health.latencyMs).toBeGreaterThanOrEqual(0);
    expect(health.components.length).toBeGreaterThan(0);
    expect(health.getComponentCheck('mssql')?.status).toBe('HEALTHY');
    expect(health.getComponentCheck('rabbitmq')?.status).toBe('HEALTHY');
  });

  it('should allow toggling in-memory state to DOWN or DEGRADED for test scenarios', async () => {
    const gateway = new MockHealthGateway();

    gateway.setSimulatedStatus('DOWN');
    const downHealth = await gateway.getHealth();
    expect(downHealth.status).toBe('DOWN');
    expect(downHealth.isOperational).toBe(false);

    gateway.setSimulatedStatus('DEGRADED');
    const degradedHealth = await gateway.getHealth();
    expect(degradedHealth.status).toBe('DEGRADED');
    expect(degradedHealth.isOperational).toBe(true);
  });
});
