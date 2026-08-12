import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import type { FuelUnitMapping } from './fuel-unit-mapping.entity';
import type { UnitFormulaMapping } from './unit-formula-mapping.entity';
import type { EmissionFactor } from './emission-factor.entity';

@Entity({ name: 'master_unit' })
export class MasterUnit extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string; // e.g. 'Kilogram CO2 Equivalent', 'Standard Cubic Metre'

  @Column({ type: 'varchar', length: 50, unique: true })
  symbol: string; // e.g. 'kgCO2e', 'sm3', 'L', 'MWh', 'tCO2e'

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany('FuelUnitMapping', 'masterUnit')
  fuelMappings: FuelUnitMapping[];

  @OneToMany('UnitFormulaMapping', 'masterUnit')
  formulaMappings: UnitFormulaMapping[];

  @OneToMany('EmissionFactor', 'unitBasis')
  emissionFactors: EmissionFactor[];
}
