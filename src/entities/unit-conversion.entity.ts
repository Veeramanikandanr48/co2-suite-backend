import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { MasterUnit } from './master-unit.entity';

@Entity({ name: 'unit_conversions' })
@Unique(['fromUnitId', 'toUnitId'])
export class UnitConversion extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  fromUnitId: number;

  @ManyToOne(() => MasterUnit, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'fromUnitId' })
  fromUnit: MasterUnit;

  @Column({ type: 'int' })
  toUnitId: number;

  @ManyToOne(() => MasterUnit, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'toUnitId' })
  toUnit: MasterUnit;

  @Column({ type: 'decimal', precision: 18, scale: 10 })
  multiplier: number;

  @Column({ type: 'decimal', precision: 18, scale: 10, default: 0 })
  offsetVal: number;
}
