import { SystemHealth } from './SystemHealth';

export interface HealthGatewayPort {
  getHealth(): Promise<SystemHealth>;
}
