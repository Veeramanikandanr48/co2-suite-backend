import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ApiKey,
  AuditLog,
  Tenant,
  WebhookEndpoint,
} from 'src/entities/enterprise.entity';

@Injectable()
export class EnterpriseService implements OnApplicationBootstrap {
  private readonly logger = new Logger(EnterpriseService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(ApiKey)
    private readonly apiKeyRepo: Repository<ApiKey>,
    @InjectRepository(WebhookEndpoint)
    private readonly webhookRepo: Repository<WebhookEndpoint>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async onApplicationBootstrap() {
    try {
      const count = await this.tenantRepo.count();
      if (count === 0) {
        this.logger.log('Seeding default Tenant (Acme Corporation)...');
        await this.tenantRepo.save({
          name: 'Acme Corporation',
          slug: 'acme',
          status: 'active',
          planType: 'enterprise',
          dataRetentionDays: 2555, // 7 years
          maxOrganizations: 100,
        });
      }
    } catch (err) {
      this.logger.error('Failed to seed default Tenant', err);
    }
  }

  // Tenant APIs
  async getTenants(): Promise<Tenant[]> {
    return this.tenantRepo.find({ where: { isActive: true }, order: { id: 'ASC' } });
  }

  async createTenant(dto: Partial<Tenant>): Promise<Tenant> {
    const entity = this.tenantRepo.create(dto);
    return this.tenantRepo.save(entity);
  }

  // API Keys
  async getApiKeys(organizationId?: number): Promise<ApiKey[]> {
    const where: any = { isActive: true };
    if (organizationId) where.organizationId = organizationId;
    return this.apiKeyRepo.find({ where, order: { id: 'DESC' } });
  }

  async createApiKey(dto: {
    name: string;
    organizationId?: number;
    tenantId?: number;
    permissions?: string[];
  }): Promise<{ apiKeySecret: string; record: ApiKey }> {
    const prefix = `co2_live_${Math.random().toString(36).substring(2, 8)}`;
    const secret = `${prefix}_${Math.random().toString(36).substring(2, 16)}`;

    const entity = this.apiKeyRepo.create({
      name: dto.name,
      keyPrefix: prefix,
      keyHash: secret, // In production: bcrypt hash of secret
      organizationId: dto.organizationId,
      tenantId: dto.tenantId || 1,
      permissions: JSON.stringify(dto.permissions || ['read:all', 'write:all']),
    });

    const saved = await this.apiKeyRepo.save(entity);
    return { apiKeySecret: secret, record: saved };
  }

  // Webhooks
  async getWebhookEndpoints(organizationId?: number): Promise<WebhookEndpoint[]> {
    const where: any = { isActive: true };
    if (organizationId) where.organizationId = organizationId;
    return this.webhookRepo.find({ where, order: { id: 'DESC' } });
  }

  async createWebhookEndpoint(dto: {
    name: string;
    url: string;
    events: string[];
    organizationId?: number;
  }): Promise<WebhookEndpoint> {
    const secret = `whsec_${Math.random().toString(36).substring(2, 16)}`;
    const entity = this.webhookRepo.create({
      name: dto.name,
      url: dto.url,
      secret,
      events: JSON.stringify(dto.events || ['calculation.completed', 'report.generated']),
      organizationId: dto.organizationId,
    });
    return this.webhookRepo.save(entity);
  }

  // Audit Logs
  async getAuditLogs(organizationId?: number, entityName?: string): Promise<AuditLog[]> {
    const query = this.auditRepo.createQueryBuilder('audit').orderBy('audit.createdAt', 'DESC').take(100);
    if (organizationId) {
      query.andWhere('audit.organizationId = :orgId', { orgId: organizationId });
    }
    if (entityName) {
      query.andWhere('audit.entityName = :entityName', { entityName });
    }
    return query.getMany();
  }
}
