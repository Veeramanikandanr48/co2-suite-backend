import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import type { MasterUnit } from './master-unit.entity';

@Index('idx_unit_conversion_from_to', ['fromUnit', 'toUnit'])
@Entity({ name: 'unit_conversions' })
export class UnitConversion extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  fromUnit: string;

  @Column({ type: 'varchar', length: 50 })
  toUnit: string;

  @Column({ type: 'float' })
  conversionFactor: number;

  @Column({ type: 'int', nullable: true })
  fromUnitId: number;

  @ManyToOne('MasterUnit', { nullable: true })
  @JoinColumn({ name: 'fromUnitId' })
  fromUnitRef: MasterUnit;

  @Column({ type: 'int', nullable: true })
  toUnitId: number;

  @ManyToOne('MasterUnit', { nullable: true })
  @JoinColumn({ name: 'toUnitId' })
  toUnitRef: MasterUnit;

  @Column({ type: 'varchar', length: 255, nullable: true })
  source: string;

  @Column({ type: 'text', nullable: true })
  description: string;
}