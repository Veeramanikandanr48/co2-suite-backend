import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';

export enum PhysicalDimension {
  MASS = 'MASS',
  VOLUME = 'VOLUME',
  ENERGY = 'ENERGY',
  DISTANCE = 'DISTANCE',
  AREA = 'AREA',
  TIME = 'TIME',
  CURRENCY = 'CURRENCY',
  CUSTOM = 'CUSTOM',
}

@Entity({ name: 'unit_conversions' })
@Index(['fromUnitCode', 'toUnitCode'], { unique: true })
export class UnitConversion extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  fromUnitCode: string;

  @Column({ type: 'varchar', length: 50 })
  toUnitCode: string;

  @Column({ type: 'float8' })
  multiplier: number;

  @Column({ type: 'float8', default: 0 })
  offset: number;

  @Column({ type: 'varchar', length: 50, default: PhysicalDimension.MASS })
  dimension: PhysicalDimension;

  @Column({ type: 'varchar', nullable: true })
  description: string;
}
