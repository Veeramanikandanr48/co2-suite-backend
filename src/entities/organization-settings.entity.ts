import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from './organization.entity';

@Entity({ name: 'organization_settings', schema: 'public' })
export class OrganizationSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  organizationId: string;

  @Column({ type: 'varchar', length: 50, default: 'UTC' })
  timezone: string;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @Column({ type: 'varchar', length: 10, default: 'en' })
  language: string;

  @Column({ type: 'varchar', length: 20, default: 'YYYY-MM-DD' })
  dateFormat: string;

  @Column({ type: 'integer', default: 2 })
  decimalPlaces: number;

  @Column({ type: 'text', nullable: true })
  logoUrl?: string;

  @Column({ type: 'varchar', length: 50, default: 'light' })
  theme: string;

  @Column({ type: 'varchar', length: 100, default: 'GHG Protocol Corporate Standard' })
  defaultEmissionStandard: string;

  @OneToOne(() => Organization, (org) => org.settings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
