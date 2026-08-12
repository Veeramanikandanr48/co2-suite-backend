import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';

@Index('idx_audit_trail_entity', ['entityType', 'entityId'])
@Index('idx_audit_trail_org', ['organizationId', 'createdAt'])
@Entity({ name: 'audit_trail' })
export class AuditTrail extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  organizationId: number;

  @Column({ type: 'varchar', length: 100 })
  entityType: string;

  @Column({ type: 'int', nullable: true })
  entityId: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  entityLabel: string;

  @Column({ type: 'varchar', length: 50 })
  action: string;

  @Column({ type: 'jsonb', nullable: true })
  beforeJson: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  afterJson: Record<string, unknown>;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  reason: string;
}