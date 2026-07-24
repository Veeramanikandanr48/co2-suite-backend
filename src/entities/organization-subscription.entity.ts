import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { MasterModule } from './master-module.entity';

export enum SubscriptionStatusEnum {
  ACTIVE = 'ACTIVE',
  TRIAL = 'TRIAL',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
}

@Entity({ name: 'organization_subscriptions', schema: 'public' })
export class OrganizationSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'uuid' })
  moduleId: string;

  @Column({
    type: 'enum',
    enum: SubscriptionStatusEnum,
    default: SubscriptionStatusEnum.ACTIVE,
  })
  status: SubscriptionStatusEnum;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  startsAt: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'integer', default: 10 })
  maxUsers: number;

  @Column({ type: 'integer', default: 5 })
  maxFacilities: number;

  @Column({ type: 'integer', default: 100 })
  maxReports: number;

  @Column({ type: 'integer', default: 10 })
  storageLimitGB: number;

  @Column({ type: 'integer', default: 10000 })
  apiLimit: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  licenseKey?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  activatedBy?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  activatedAt?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  deactivatedBy?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  deactivatedAt?: Date;

  @Column({ type: 'text', nullable: true })
  deactivationReason?: string;

  @ManyToOne(() => Organization, (org) => org.subscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @ManyToOne(() => MasterModule, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'moduleId' })
  module: MasterModule;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
