import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import type { MasterUnitDimension } from './master-unit-dimension.entity';
import type { FuelUnitMapping } from './fuel-unit-mapping.entity';
import type { UnitFormulaMapping } from './unit-formula-mapping.entity';

@Entity({ name: 'master_unit' })
@Unique(['symbol'])
export class MasterUnit extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  dimensionId: number;

  @ManyToOne('MasterUnitDimension', 'units', {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'dimensionId' })
  dimension: MasterUnitDimension;

  @Column({ type: 'varchar', length: 100 })
  name: string; // e.g. 'Kilogram CO2 Equivalent', 'Standard Cubic Metre'

  @Column({ type: 'varchar', length: 50, unique: true })
  symbol: string; // e.g. 'kgCO2e', 'sm3', 'L', 'MWh', 'tCO2e'

  @Column({ type: 'boolean', default: false })
  isBaseUnit: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany('FuelUnitMapping', 'masterUnit')
  fuelMappings: FuelUnitMapping[];

  @OneToMany('UnitFormulaMapping', 'masterUnit')
  formulaMappings: UnitFormulaMapping[];
}
