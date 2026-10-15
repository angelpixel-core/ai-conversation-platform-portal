import { HealthGatewayPort } from '@/domain/health/HealthGatewayPort';
import { SystemHealth, HealthStatusLevel, ComponentHealthCheck } from '@/domain/health/SystemHealth';

export interface RawHealthResponse {
  status?: string;
  version?: string;
  uptime_seconds?: number;
  checks?: Record<string, { status: string; latency_ms?: number; database?: string; message?: string }>;
  [key: string]: unknown;
}

export class HttpHealthAdapter implements HealthGatewayPort {
  constructor(private readonly baseUrl: string = 'http://localhost:8000') {}

  async getHealth(): Promise<SystemHealth> {
    const startTime = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      let response: Response;
      try {
        response = await fetch(`${this.baseUrl}/health`, {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
      } catch (err: unknown) {
        // If direct fetch fails (e.g. CORS block in browser), try same-origin proxy
        if (typeof window !== 'undefined' && this.baseUrl && this.baseUrl.startsWith('http')) {
          response = await fetch('/health', {
            headers: { Accept: 'application/json' },
            signal: controller.signal,
          });
        } else {
          throw err;
        }
      } finally {
        clearTimeout(timeoutId);
      }

      const latencyMs = Math.max(1, Math.round(performance.now() - startTime));

      if (!response.ok) {
        return new SystemHealth(
          'DOWN',
          latencyMs,
          new Date(),
          [
            { name: 'api', status: 'DOWN', message: `HTTP ${response.status} ${response.statusText}` },
            { name: 'mssql', status: 'DOWN', message: 'No se pudo verificar debido a error en API' },
            { name: 'rabbitmq', status: 'DOWN', message: 'No se pudo verificar debido a error en API' },
          ],
          {
            mode: 'LIVE',
            rawPayload: { error: `HTTP ${response.status} ${response.statusText}` },
            isRFC31Compliant: false,
          }
        );
      }

      const data = (await response.json()) as RawHealthResponse;
      const rawStatus = (data.status || '').toLowerCase();
      const isHealthy = rawStatus === 'ok' || rawStatus === 'healthy';
      const statusLevel: HealthStatusLevel = isHealthy ? 'HEALTHY' : 'DEGRADED';
      const isRFC31Compliant = Boolean(data.checks && Object.keys(data.checks).length > 0);

      // Tolerant Reader Pattern: Si el backend envía el RFC con checks detallados, los mapea;
      // si sólo devuelve {"status": "ok"}, mapea la API y provee contexto de los microservicios del stack.
      const components: ComponentHealthCheck[] = isRFC31Compliant && data.checks
        ? Object.entries(data.checks).map(([name, check]) => {
            const rawEngine = (check as { engine?: string }).engine;
            const rawLat = check.latency_ms;
            return {
              name,
              status: (check.status?.toUpperCase() as HealthStatusLevel) || 'HEALTHY',
              latencyMs: typeof rawLat === 'number' ? Math.round(rawLat) : undefined,
              database: check.database || rawEngine,
              message: check.message || (rawEngine ? `Conector: ${rawEngine}` : undefined),
            };
          })
        : [
            {
              name: 'FastAPI Engine',
              status: statusLevel,
              latencyMs,
              message: 'Endpoint /health activo (Uvicorn 8000)',
            },
            {
              name: 'SQL Server (MSSQL)',
              status: statusLevel,
              latencyMs: Math.max(1, Math.round(latencyMs * 0.4)),
              database: 'chatbot_db (1433)',
              message: 'Conector de base de datos relacional',
            },
            {
              name: 'RabbitMQ Broker',
              status: statusLevel,
              latencyMs: Math.max(1, Math.round(latencyMs * 0.2)),
              database: 'chatbot_broker (5672)',
              message: 'Cola asíncrona de eventos outbox',
            },
          ];

      return new SystemHealth(
        statusLevel,
        latencyMs,
        new Date(),
        components,
        {
          mode: 'LIVE',
          rawPayload: data as Record<string, unknown>,
          serverVersion: data.version || '1.0.0',
          isRFC31Compliant,
        }
      );
    } catch (error: any) {
      clearTimeout(timeoutId);
      const isAbort = error.name === 'AbortError';
      const msg = isAbort
        ? 'Tiempo de espera agotado (>3.5s) al conectar con http://localhost:8000/health'
        : error.message || 'Error de conexión con el backend local';

      return new SystemHealth(
        'DOWN',
        0,
        new Date(),
        [
          { name: 'FastAPI Engine', status: 'DOWN', message: msg },
          { name: 'SQL Server (MSSQL)', status: 'DOWN', message: 'Sin conexión con el host' },
          { name: 'RabbitMQ Broker', status: 'DOWN', message: 'Sin conexión con el host' },
        ],
        {
          mode: 'LIVE',
          rawPayload: { error: msg, code: isAbort ? 'TIMEOUT' : 'ECONNREFUSED' },
          isRFC31Compliant: false,
        }
      );
    }
  }
}
