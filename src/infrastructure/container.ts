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

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const liveHealthAdapter = new HttpHealthAdapter(apiBaseUrl);
const mockHealthGateway = new MockHealthGateway();

const liveTenantAdapter = new HttpTenantAdapter(apiBaseUrl);
const mockTenantGateway = new MockTenantGateway();

const liveConversationAdapter = new HttpConversationAdapter(apiBaseUrl);
const mockConversationGateway = new MockConversationGateway();

export const container: AppContainer = {
  healthGateway: {
    getHealth: () => {
      const mode = runtimeEnvironmentStore.getMode();
      return mode === 'LIVE' ? liveHealthAdapter.getHealth() : mockHealthGateway.getHealth();
    },
  },
  tenantGateway: {
    getTenants: () => {
      const mode = runtimeEnvironmentStore.getMode();
      return mode === 'LIVE' ? liveTenantAdapter.getTenants() : mockTenantGateway.getTenants();
    },
    createTenant: (input) => {
      const mode = runtimeEnvironmentStore.getMode();
      return mode === 'LIVE' ? liveTenantAdapter.createTenant(input) : mockTenantGateway.createTenant(input);
    },
  },
  conversationGateway: {
    getConversation: (id: string) => {
      const mode = runtimeEnvironmentStore.getMode();
      return mode === 'LIVE'
        ? liveConversationAdapter.getConversation(id)
        : mockConversationGateway.getConversation(id);
    },
    createConversation: (title: string, idempotencyKey: string) => {
      const mode = runtimeEnvironmentStore.getMode();
      return mode === 'LIVE'
        ? liveConversationAdapter.createConversation(title, idempotencyKey)
        : mockConversationGateway.createConversation(title, idempotencyKey);
    },
    sendMessage: (conversationId: string, content: string, idempotencyKey: string) => {
      const mode = runtimeEnvironmentStore.getMode();
      return mode === 'LIVE'
        ? liveConversationAdapter.sendMessage(conversationId, content, idempotencyKey)
        : mockConversationGateway.sendMessage(conversationId, content, idempotencyKey);
    },
  },
};
