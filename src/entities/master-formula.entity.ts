import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import type { UnitFormulaMapping } from './unit-formula-mapping.entity';

export interface GasRatios {
  CO2: number;
  CH4: number;
  N2O: number;
  HFC: number;
  PFC: number;
  SF6: number;
  NF3: number;
}

@Entity({ name: 'master_formula' })
export class MasterFormula extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string; // e.g. 'Standard Factor Conversion', 'Direct Emission'

  @Column({ type: 'text' })
  formula: string; // e.g. '(amount * factor) / 1000', 'amount * factor'

  @Column({ type: 'simple-json', nullable: true })
  variables: string[]; // e.g. ['amount', 'factor']

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  outputUnit: string; // e.g. 'tCO2e', 'kgCO2e'

  /** Canonical method code used as the dispatch key for the calculation engine.
   *  Must be unique across all formulas.
   *  e.g. FUEL_BASED | DISTANCE_BASED | DISTANCE_WEIGHT | SPEND_EEIO | LEAKAGE_RATE */
  @Column({ type: 'varchar', length: 60, nullable: true, unique: true })
  methodCode: string | null;

  /** Gas species emission ratios for this formula type.
   *  Replaces the hardcoded switch in FactorResolver.resolveGasRatios().
   *  If null, defaults to { CO2: 1.0, CH4: 0, N2O: 0, HFC: 0, PFC: 0, SF6: 0, NF3: 0 }. */
  @Column({ type: 'json', nullable: true })
  gasRatios: GasRatios | null;

  @OneToMany('UnitFormulaMapping', 'masterFormula')
  unitMappings: UnitFormulaMapping[];
}
