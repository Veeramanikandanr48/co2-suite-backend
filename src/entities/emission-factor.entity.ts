import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { FactorDatasetVersion } from './factor-dataset-version.entity';
import { MasterActivityType } from './master-activity-type.entity';
import { MasterFuel } from './master-fuel.entity';
import { MasterEnergyType } from './master-energy-type.entity';
import { MasterUnit } from './master-unit.entity';
import { MasterGeography } from './master-geography.entity';
import { EvidenceCitation } from './evidence-citation.entity';
import type { EmissionFactorComponent } from './emission-factor-component.entity';

@Entity({ name: 'emission_factors' })
@Index('idx_ef_lookup', [
  'datasetVersionId',
  'activityTypeId',
  'fuelId',
  'energyTypeId',
  'unitId',
  'geographyId',
])
@Unique('idx_ef_unique_identity', [
  'datasetVersionId',
  'activityTypeId',
  'fuelId',
  'energyTypeId',
  'unitId',
  'geographyId',
  'validFrom',
])
export class EmissionFactor extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  datasetVersionId: number;

  @ManyToOne(() => FactorDatasetVersion, (v) => v.factors, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'datasetVersionId' })
  datasetVersion: FactorDatasetVersion;

  @Column({ type: 'int', nullable: true })
  activityTypeId: number;

  @ManyToOne(() => MasterActivityType, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'activityTypeId' })
  activityType: MasterActivityType;

  @Column({ type: 'int', nullable: true })
  fuelId: number;

  @ManyToOne(() => MasterFuel, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'fuelId' })
  fuel: MasterFuel;

  @Column({ type: 'int', nullable: true })
  energyTypeId: number;

  @ManyToOne(() => MasterEnergyType, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'energyTypeId' })
  energyType: MasterEnergyType;

  @Column({ type: 'int' })
  unitId: number;

  @ManyToOne(() => MasterUnit, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'unitId' })
  unit: MasterUnit;

  @Column({ type: 'int', nullable: true })
  geographyId: number;

  @ManyToOne(() => MasterGeography, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'geographyId' })
  geography: MasterGeography;

  @Column({ type: 'varchar', length: 50, default: 'CO2E_TOTAL' })
  factorBasis: string; // CO2E_TOTAL, CO2E_COMPONENT, GAS_MASS

  @Column({ type: 'decimal', precision: 18, scale: 10 })
  factorValue: number;

  @Column({ type: 'varchar', length: 50, default: 'GROSS_CV' })
  calorificBasis: string; // GROSS_CV, NET_CV, NOT_APPLICABLE

  @Column({ type: 'decimal', precision: 12, scale: 6, nullable: true })
  density: number;

  @Column({ type: 'int', nullable: true })
  evidenceCitationId: number;

  @ManyToOne(() => EvidenceCitation, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'evidenceCitationId' })
  evidenceCitation: EvidenceCitation;

  @Column({ type: 'date' })
  validFrom: string;

  @Column({ type: 'date', nullable: true })
  validTo: string;

  @OneToMany('EmissionFactorComponent', 'emissionFactor')
  components: EmissionFactorComponent[];

  validateTemporalValidity(): void {
    if (this.validTo && new Date(this.validFrom) > new Date(this.validTo)) {
      throw new Error(
        `validFrom (${this.validFrom}) cannot be after validTo (${this.validTo})`,
      );
    }
    if (this.factorValue != null && Number(this.factorValue) < 0) {
      throw new Error(`factorValue (${this.factorValue}) cannot be negative`);
    }
  }
}
