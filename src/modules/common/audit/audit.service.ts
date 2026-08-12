import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditTrail } from 'src/entities/audit-trail.entity';

export interface AuditEventInput {
  organizationId?: number;
  entityType: string;
  entityId?: number;
  entityLabel?: string;
  action: string;
  beforeJson?: Record<string, unknown>;
  afterJson?: Record<string, unknown>;
  reason?: string;
  actorId?: number;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditTrail)
    private readonly auditRepo: Repository<AuditTrail>,
  ) {}

  async record(event: AuditEventInput): Promise<AuditTrail> {
    const entry = this.auditRepo.create({
      organizationId: event.organizationId,
      entityType: event.entityType,
      entityId: event.entityId,
      entityLabel: event.entityLabel,
      action: event.action,
      beforeJson: event.beforeJson,
      afterJson: event.afterJson,
      reason: event.reason,
      createdBy: event.actorId,
      isActive: true,
    });
    return this.auditRepo.save(entry);
  }

  async query(params: {
    entityType?: string;
    entityId?: number;
    action?: string;
    organizationId?: number;
    page?: number;
    limit?: number;
  }): Promise<{ items: AuditTrail[]; totalRecords: number }> {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const qb = this.auditRepo
      .createQueryBuilder('audit')
      .where('audit.isActive = :isActive', { isActive: true })
      .orderBy('audit.createdAt', 'DESC');

    if (params.entityType)
      qb.andWhere('audit.entityType = :entityType', {
        entityType: params.entityType,
      });
    if (params.entityId)
      qb.andWhere('audit.entityId = :entityId', { entityId: params.entityId });
    if (params.action)
      qb.andWhere('audit.action = :action', { action: params.action });
    if (params.organizationId)
      qb.andWhere('audit.organizationId = :organizationId', {
        organizationId: params.organizationId,
      });

    qb.skip((page - 1) * limit).take(limit);
    const [items, totalRecords] = await qb.getManyAndCount();
    return { items, totalRecords };
  }
}
