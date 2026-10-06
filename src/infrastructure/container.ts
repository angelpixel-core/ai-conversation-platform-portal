import { HealthGatewayPort } from '@/domain/health/HealthGatewayPort';
import { HttpHealthAdapter } from './api/HttpHealthAdapter';
import { MockHealthGateway } from './api/MockHealthGateway';

export interface AppContainer {
  healthGateway: HealthGatewayPort;
}

const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const container: AppContainer = {
  healthGateway: useMocks ? new MockHealthGateway() : new HttpHealthAdapter(apiBaseUrl),
};
