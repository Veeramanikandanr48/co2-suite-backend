import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';

export enum MasterItemType {
  FUEL_TYPE = 'FUEL_TYPE',
  ACTIVITY_CATEGORY = 'ACTIVITY_CATEGORY',
  UNIT = 'UNIT',
  GAS_TYPE = 'GAS_TYPE',
  SCOPE = 'SCOPE',
  FACTOR_SOURCE = 'FACTOR_SOURCE',
  FACTOR_VERSION = 'FACTOR_VERSION',
}

@Entity({ name: 'master_items' })
@Index(['type', 'isActive'])
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
}
