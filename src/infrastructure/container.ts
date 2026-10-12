import { HealthGatewayPort } from '@/domain/health/HealthGatewayPort';
import { TenantGatewayPort } from '@/domain/tenants/TenantGatewayPort';
import { ConversationGatewayPort } from '@/domain/conversations/ConversationGatewayPort';
import { HttpHealthAdapter } from './api/HttpHealthAdapter';
import { MockHealthGateway } from './api/MockHealthGateway';
import { HttpTenantAdapter } from './api/HttpTenantAdapter';
import { MockTenantGateway } from './api/MockTenantGateway';
import { HttpConversationAdapter } from './api/HttpConversationAdapter';
import { MockConversationGateway } from './api/MockConversationGateway';

export interface AppContainer {
  healthGateway: HealthGatewayPort;
  tenantGateway: TenantGatewayPort;
  conversationGateway: ConversationGatewayPort;
}

const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const container: AppContainer = {
  healthGateway: useMocks ? new MockHealthGateway() : new HttpHealthAdapter(apiBaseUrl),
  tenantGateway: useMocks ? new MockTenantGateway() : new HttpTenantAdapter(apiBaseUrl),
  conversationGateway: useMocks
    ? new MockConversationGateway()
    : new HttpConversationAdapter(apiBaseUrl),
};
