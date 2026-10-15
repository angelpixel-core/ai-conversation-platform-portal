import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpHealthAdapter } from './HttpHealthAdapter';

describe('HttpHealthAdapter', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('tolerantly parses legacy backend response {"status": "ok"}', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' }),
    } as Response);

    const adapter = new HttpHealthAdapter('http://localhost:8000');
    const health = await adapter.getHealth();

    expect(health.status).toBe('HEALTHY');
    expect(health.mode).toBe('LIVE');
    expect(health.isRFC31Compliant).toBe(false);
    expect(health.rawPayload).toEqual({ status: 'ok' });
    expect(health.components).toHaveLength(3);
    expect(health.components[0].name).toBe('FastAPI Engine');
    expect(health.components[0].status).toBe('HEALTHY');
    expect(health.components[1].name).toBe('SQL Server (MSSQL)');
    expect(health.components[2].name).toBe('RabbitMQ Broker');
  });

  it('parses RFC-01 rich payload with database and broker checks', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status: 'healthy',
        checks: {
          database: { status: 'HEALTHY', latency_ms: 12, database: 'chatbot_dev' },
          broker: { status: 'HEALTHY', latency_ms: 4, message: 'RabbitMQ connected' },
        },
      }),
    } as Response);

    const adapter = new HttpHealthAdapter('http://localhost:8000');
    const health = await adapter.getHealth();

    expect(health.status).toBe('HEALTHY');
    expect(health.mode).toBe('LIVE');
    expect(health.isRFC31Compliant).toBe(true);
    expect(health.components).toHaveLength(2);
    expect(health.components.find((c) => c.name === 'database')?.latencyMs).toBe(12);
    expect(health.components.find((c) => c.name === 'broker')?.message).toBe('RabbitMQ connected');
  });

  it('handles HTTP 503 Service Unavailable gracefully without throwing', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    } as Response);

    const adapter = new HttpHealthAdapter('http://localhost:8000');
    const health = await adapter.getHealth();

    expect(health.status).toBe('DOWN');
    expect(health.components[0].status).toBe('DOWN');
    expect(health.components[0].message).toContain('503 Service Unavailable');
  });

  it('handles network failure (fetch rejected) as DOWN', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

    const adapter = new HttpHealthAdapter('http://localhost:8000');
    const health = await adapter.getHealth();

    expect(health.status).toBe('DOWN');
    expect(health.components[0].status).toBe('DOWN');
    expect(health.components[0].message).toBe('Connection refused');
  });
});
