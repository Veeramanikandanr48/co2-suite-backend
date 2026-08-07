import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { MasterCategory } from './master-category.entity';
import { ServiceDomain } from './service-domain.entity';

export interface MasterTypeFeatures {
  hierarchy?: boolean;
  versioning?: boolean;
  approval?: boolean;
  bulkImport?: boolean;
  bulkExport?: boolean;
  translation?: boolean;
  allowAttributes?: boolean;
  allowParent?: boolean;
  allowAttachments?: boolean;
  allowStatus?: boolean;
  allowEffectiveDates?: boolean;
}

@Entity({ name: 'master_types' })
export class MasterType extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  categoryId: number;

  @ManyToOne(() => MasterCategory, (category) => category.types, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category: MasterCategory;

  @Column({ type: 'varchar', unique: true, length: 50 })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', nullable: true, length: 50 })
  icon: string;

  @Column({ type: 'varchar', nullable: true, length: 30 })
  color: string;

  @Column({ type: 'int', nullable: true })
  activeSchemaVersionId: number;

  // Extensible JSONB Feature Flags & Specialized UI Schemas
  @Column({ type: 'jsonb', nullable: true })
  features: MasterTypeFeatures;

  // Single Cohesive Versioned Schema Document
  @Column({ type: 'jsonb', nullable: true })
  masterTypeSchema: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  formSchema: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  validationSchema: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  gridSchema: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  detailSchema: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  workflowSchema: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  eventSchema: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  searchSchema: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  importSchema: Record<string, any>;

  @ManyToMany(() => ServiceDomain, (serviceDomain) => serviceDomain.masterTypes)
  @JoinTable({
    name: 'master_type_service_domains',
    joinColumn: { name: 'masterTypeId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'serviceDomainId', referencedColumnName: 'id' },
  })
  serviceDomains: ServiceDomain[];

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
