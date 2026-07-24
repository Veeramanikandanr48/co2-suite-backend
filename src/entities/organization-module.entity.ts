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

export enum ModuleSubscriptionStatusEnum {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  TRIAL = 'TRIAL',
}

@Entity({ name: 'organization_modules', schema: 'public' })
export class OrganizationModule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'uuid' })
  moduleId: string;

  @Column({
    type: 'enum',
    enum: ModuleSubscriptionStatusEnum,
    default: ModuleSubscriptionStatusEnum.ACTIVE,
  })
  status: ModuleSubscriptionStatusEnum;

  @Column({ type: 'timestamp with time zone', nullable: true })
  validFrom?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  validTo?: Date;

  @ManyToOne(() => Organization, (org) => org.organizationModules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @ManyToOne(() => MasterModule, (mod) => mod.organizationModules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'moduleId' })
  module: MasterModule;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
