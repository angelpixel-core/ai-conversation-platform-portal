import { HealthGatewayPort } from '@/domain/health/HealthGatewayPort';
import { SystemHealth, HealthStatusLevel, ComponentHealthCheck } from '@/domain/health/SystemHealth';

export class MockHealthGateway implements HealthGatewayPort {
  private simulatedStatus: HealthStatusLevel = 'HEALTHY';

  setSimulatedStatus(status: HealthStatusLevel): void {
    this.simulatedStatus = status;
  }

  async getHealth(): Promise<SystemHealth> {
    // Simulación in-memory de latencia
    const latency = this.simulatedStatus === 'HEALTHY' ? 24 : this.simulatedStatus === 'DEGRADED' ? 420 : 0;

    const components: ComponentHealthCheck[] =
      this.simulatedStatus === 'DOWN'
        ? [
            { name: 'mssql', status: 'DOWN', message: 'Connection refused' },
            { name: 'rabbitmq', status: 'DOWN', message: 'Broker unreachable' },
          ]
        : [
            {
              name: 'mssql',
              status: this.simulatedStatus === 'DEGRADED' ? 'DEGRADED' : 'HEALTHY',
              latencyMs: 4,
              database: 'ChatbotDB',
            },
            {
              name: 'rabbitmq',
              status: 'HEALTHY',
              latencyMs: 2,
            },
          ];

    return new SystemHealth(this.simulatedStatus, latency, new Date(), components);
  }
}
