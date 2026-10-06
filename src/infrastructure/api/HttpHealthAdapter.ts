import { HealthGatewayPort } from '@/domain/health/HealthGatewayPort';
import { SystemHealth, HealthStatusLevel, ComponentHealthCheck } from '@/domain/health/SystemHealth';

export interface RawHealthResponse {
  status?: string;
  checks?: Record<string, { status: string; latency_ms?: number; database?: string; message?: string }>;
}

export class HttpHealthAdapter implements HealthGatewayPort {
  constructor(private readonly baseUrl: string = 'http://localhost:8000') {}

  async getHealth(): Promise<SystemHealth> {
    const startTime = performance.now();

    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        headers: { Accept: 'application/json' },
      });

      const latencyMs = Math.max(1, Math.round(performance.now() - startTime));

      if (!response.ok) {
        return new SystemHealth('DOWN', latencyMs, new Date(), [
          { name: 'api', status: 'DOWN', message: `HTTP ${response.status} ${response.statusText}` },
        ]);
      }

      const data = (await response.json()) as RawHealthResponse;
      const rawStatus = (data.status || '').toLowerCase();
      const isHealthy = rawStatus === 'ok' || rawStatus === 'healthy';
      const statusLevel: HealthStatusLevel = isHealthy ? 'HEALTHY' : 'DEGRADED';

      // Tolerant Reader Pattern: Si el backend envía el RFC-01 con checks detallados, los mapea;
      // si sólo devuelve {"status": "ok"}, genera un fallback limpio sin romperse.
      const components: ComponentHealthCheck[] = data.checks
        ? Object.entries(data.checks).map(([name, check]) => ({
            name,
            status: (check.status?.toUpperCase() as HealthStatusLevel) || 'HEALTHY',
            latencyMs: check.latency_ms,
            database: check.database,
            message: check.message,
          }))
        : [
            {
              name: 'api',
              status: statusLevel,
              latencyMs,
            },
          ];

      return new SystemHealth(statusLevel, latencyMs, new Date(), components);
    } catch (error: any) {
      return new SystemHealth('DOWN', 0, new Date(), [
        { name: 'api', status: 'DOWN', message: error.message || 'Network connection failed' },
      ]);
    }
  }
}
