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
import { MasterFeature } from './master-feature.entity';

export enum FeatureSubscriptionStatusEnum {
  ACTIVE = 'ACTIVE',
  TRIAL = 'TRIAL',
  EXPIRED = 'EXPIRED',
}

@Entity({ name: 'organization_feature_subscriptions', schema: 'public' })
export class OrganizationFeatureSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'uuid' })
  featureId: string;

  @Column({
    type: 'enum',
    enum: FeatureSubscriptionStatusEnum,
    default: FeatureSubscriptionStatusEnum.ACTIVE,
  })
  status: FeatureSubscriptionStatusEnum;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expiresAt?: Date;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @ManyToOne(() => MasterFeature, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'featureId' })
  feature: MasterFeature;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
