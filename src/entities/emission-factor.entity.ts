import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import type { MasterFuel } from './master-fuel.entity';
import type { MasterFactorVersion } from './master-factor-version.entity';
import type { MasterUnit } from './master-unit.entity';

@Unique('uq_emission_factor_identity', [
  'fuelId',
  'factorVersionId',
  'unitBasisId',
  'geography',
  'methodology',
])
@Index('idx_emission_factor_resolution', [
  'fuelId',
  'factorVersionId',
  'unitBasisId',
  'isActive',
])
@Entity({ name: 'emission_factors' })
export class EmissionFactor extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  fuelId: number;

  @ManyToOne('MasterFuel', 'emissionFactors', { nullable: true })
  @JoinColumn({ name: 'fuelId' })
  fuel: MasterFuel;

  @Column({ type: 'int', nullable: true })
  factorVersionId: number;

  @ManyToOne('MasterFactorVersion', 'emissionFactors', { nullable: true })
  @JoinColumn({ name: 'factorVersionId' })
  factorVersion: MasterFactorVersion;

  @Column({ type: 'int', nullable: true })
  unitBasisId: number;

  @ManyToOne('MasterUnit', 'emissionFactors', { nullable: true })
  @JoinColumn({ name: 'unitBasisId' })
  unitBasis: MasterUnit;

  @Column({ type: 'varchar', length: 100, default: 'GLOBAL' })
  geography: string;

  @Column({ type: 'int', nullable: true })
  reportingYear: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  methodology: string;

  @Column({ type: 'varchar', length: 50, default: 'CURRENT' })
  methodologyStatus: string; // CURRENT | DRAFT | RETIRED | CUSTOM_APPROVED

  @Column({ type: 'float' })
  factorValue: number;

  @Column({ type: 'float', nullable: true })
  co2Value: number;

  @Column({ type: 'float', nullable: true })
  ch4Value: number;

  @Column({ type: 'float', nullable: true })
  n2oValue: number;

  @Column({ type: 'float', nullable: true })
  hfcValue: number;

  @Column({ type: 'float', nullable: true })
  pfcValue: number;

  @Column({ type: 'float', nullable: true })
  sf6Value: number;

  @Column({ type: 'float', nullable: true })
  nf3Value: number;

  @Column({ type: 'float', default: 0 })
  biogenicCo2Value: number;

  @Column({ type: 'boolean', default: false })
  isFossilMethane: boolean;

  @Column({ type: 'varchar', length: 50, default: 'kgCO2e' })
  outputUnit: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  dataQuality: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  sourceReference: string;

  @Column({ type: 'boolean', default: false })
  isDefaultFactor: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;
}