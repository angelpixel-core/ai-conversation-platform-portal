import { HealthGatewayPort } from '@/domain/health/HealthGatewayPort';
import { TenantGatewayPort } from '@/domain/tenants/TenantGatewayPort';
import { ConversationGatewayPort } from '@/domain/conversations/ConversationGatewayPort';
import { HttpHealthAdapter } from './api/HttpHealthAdapter';
import { MockHealthGateway } from './api/MockHealthGateway';
import { HttpTenantAdapter } from './api/HttpTenantAdapter';
import { MockTenantGateway } from './api/MockTenantGateway';
import { HttpConversationAdapter } from './api/HttpConversationAdapter';
import { MockConversationGateway } from './api/MockConversationGateway';
import { runtimeEnvironmentStore } from './storage/runtimeEnvironmentStore';

export interface AppContainer {
  healthGateway: HealthGatewayPort;
  tenantGateway: TenantGatewayPort;
  conversationGateway: ConversationGatewayPort;
}

const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const liveHealthAdapter = new HttpHealthAdapter(apiBaseUrl);
const mockHealthGateway = new MockHealthGateway();

export const container: AppContainer = {
  healthGateway: {
    getHealth: () => {
      const mode = runtimeEnvironmentStore.getMode();
      return mode === 'LIVE' ? liveHealthAdapter.getHealth() : mockHealthGateway.getHealth();
    },
  },
  tenantGateway: useMocks ? new MockTenantGateway() : new HttpTenantAdapter(apiBaseUrl),
  conversationGateway: useMocks
    ? new MockConversationGateway()
    : new HttpConversationAdapter(apiBaseUrl),
};

