import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { UserDetails } from './user.entity';
import { OrganizationModule } from './organization-module.entity';
import { OrganizationSettings } from './organization-settings.entity';
import { OrganizationSubscription } from './organization-subscription.entity';
import { OrganizationFeatureSubscription } from './organization-feature-subscription.entity';
import { TenantProvisionLog } from './tenant-provision-log.entity';
import { TenantHealth } from './tenant-health.entity';

export enum OrganizationStatusEnum {
  PENDING = 'PENDING',
  PROVISIONING = 'PROVISIONING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  ARCHIVED = 'ARCHIVED',
  FAILED = 'FAILED',
}

export enum SubscriptionPlanEnum {
  DEMO = 'DEMO',
  ENTERPRISE = 'ENTERPRISE',
  STANDARD = 'STANDARD',
  CUSTOM = 'CUSTOM',
}

@Entity({ name: 'organizations', schema: 'public' })
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  tenantCode: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  schemaName: string;

  @Column({ type: 'varchar', length: 100, default: 'localhost' })
  databaseServer: string;

  @Column({ type: 'varchar', length: 100, default: 'co2_suite_db' })
  databaseName: string;

  @Column({ type: 'varchar', length: 50, default: 'us-east-1' })
  region: string;

  @Column({ type: 'integer', default: 1 })
  migrationVersion: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contactEmail?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  contactPhone?: string;

  @Column({
    type: 'enum',
    enum: SubscriptionPlanEnum,
    default: SubscriptionPlanEnum.STANDARD,
  })
  subscriptionPlan: SubscriptionPlanEnum;

  @Column({
    type: 'enum',
    enum: OrganizationStatusEnum,
    default: OrganizationStatusEnum.PENDING,
  })
  status: OrganizationStatusEnum;

  @OneToOne(() => OrganizationSettings, (s) => s.organization, { cascade: true })
  settings: OrganizationSettings;

  @OneToOne(() => TenantHealth, (h) => h.organization, { cascade: true })
  health: TenantHealth;

  @OneToMany(() => OrganizationSubscription, (sub) => sub.organization, { cascade: true })
  subscriptions: OrganizationSubscription[];

  @OneToMany(() => OrganizationFeatureSubscription, (fs) => fs.organization, { cascade: true })
  featureSubscriptions: OrganizationFeatureSubscription[];

  @OneToMany(() => OrganizationModule, (orgModule) => orgModule.organization, { cascade: true })
  organizationModules: OrganizationModule[];

  @OneToMany(() => TenantProvisionLog, (log) => log.organization, { cascade: true })
  provisionLogs: TenantProvisionLog[];

  @OneToMany(() => UserDetails, (user) => user.organization)
  users: UserDetails[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
