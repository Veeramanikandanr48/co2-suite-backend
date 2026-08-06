import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';

export enum MasterItemType {
  ORGANIZATION = 'ORGANIZATION',
  SCOPE = 'SCOPE',
  ACTIVITY_CATEGORY = 'ACTIVITY_CATEGORY',
  FUEL_TYPE = 'FUEL_TYPE',
  GAS_TYPE = 'GAS_TYPE',
  UNIT = 'UNIT',
  COUNTRY = 'COUNTRY',
  REGION = 'REGION',
  FACTOR_SOURCE = 'FACTOR_SOURCE',
  FACTOR_VERSION = 'FACTOR_VERSION',
  GWP_VERSION = 'GWP_VERSION',
  FORMULA = 'FORMULA',
  DATA_QUALITY = 'DATA_QUALITY',
  CURRENCY = 'CURRENCY',
  SUPPLIER = 'SUPPLIER',
  EVIDENCE = 'EVIDENCE',
  INDUSTRY = 'INDUSTRY',
  REPORTING_FRAMEWORK = 'REPORTING_FRAMEWORK',
}

export enum MasterItemStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  DEPRECATED = 'DEPRECATED',
  ARCHIVED = 'ARCHIVED',
}

@Entity({ name: 'master_items' })
@Index(['type', 'status', 'isActive'])
@Index(['effectiveFrom', 'effectiveTo'])
export class MasterItem extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  type: MasterItemType;

  @Column({ type: 'varchar', length: 100 })
  code: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, default: MasterItemStatus.PUBLISHED })
  status: MasterItemStatus;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'varchar', nullable: true, default: 'Scope 1' })
  scope: string;

  @Column({ type: 'varchar', nullable: true, default: 'Fuel' })
  subType: string;

  @Column({ type: 'jsonb', nullable: true })
  allowedUnits: string[];

  @Column({ type: 'int', nullable: true })
  parentId: number;

  @ManyToOne(() => MasterItem, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parentId' })
  parent: MasterItem;

  @Column({ type: 'varchar', nullable: true })
  path: string; // Materialized path for tree navigation e.g. /1/4/12/

  @Column({ type: 'int', default: 1 })
  level: number; // Tree depth level

  @Column({ type: 'date', nullable: true })
  effectiveFrom: string;

  @Column({ type: 'date', nullable: true })
  effectiveTo: string;

  @Column({ type: 'jsonb', nullable: true })
  tags: string[];

  @Column({ type: 'jsonb', nullable: true })
  translations: Record<string, { name?: string; description?: string }>;

  @Column({ type: 'jsonb', nullable: true })
  keywords: string[];

  @Column({ type: 'int', nullable: true })
  schemaId: number;

  @Column({ type: 'int', nullable: true })
  organizationId: number;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'jsonb', nullable: true })
  customAttributes: Record<string, any>;
}
