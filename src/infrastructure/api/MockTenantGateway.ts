import { TenantGatewayPort, CreateTenantInput } from '@/domain/tenants/TenantGatewayPort';
import { Tenant } from '@/domain/tenants/Tenant';
import { TenantId } from '@/domain/tenants/TenantId';

export class MockTenantGateway implements TenantGatewayPort {
  private tenants: Tenant[] = [
    new Tenant(
      TenantId.create('corp-acme'),
      'Acme Corporation',
      'ENTERPRISE',
      new Date('2026-09-20T10:00:00Z')
    ),
    new Tenant(
      TenantId.create('corp-globex'),
      'Globex Industries',
      'PRO',
      new Date('2026-09-22T14:30:00Z')
    ),
    new Tenant(
      TenantId.create('corp-umbrella'),
      'Umbrella Health',
      'FREE',
      new Date('2026-10-01T08:00:00Z')
    ),
  ];

  async getTenants(): Promise<Tenant[]> {
    return [...this.tenants];
  }

  async createTenant(input: CreateTenantInput): Promise<Tenant> {
    const newTenant = new Tenant(
      TenantId.create(input.id),
      input.name,
      input.tier,
      new Date()
    );
    this.tenants.push(newTenant);
    return newTenant;
  }
}
