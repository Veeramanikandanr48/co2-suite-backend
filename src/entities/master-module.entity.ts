import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { OrganizationModule } from './organization-module.entity';
import { MasterFeature } from './master-feature.entity';

@Entity({ name: 'master_modules', schema: 'public' })
export class MasterModule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  moduleKey: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50, default: 'Corporate' })
  category: string;

  @Column({ type: 'varchar', length: 50, default: 'Layers' })
  icon: string;

  @Column({ type: 'boolean', default: true })
  isEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => OrganizationModule, (orgModule) => orgModule.module)
  organizationModules: OrganizationModule[];

  @OneToMany(() => MasterFeature, (feature) => feature.module, { cascade: true })
  features: MasterFeature[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
