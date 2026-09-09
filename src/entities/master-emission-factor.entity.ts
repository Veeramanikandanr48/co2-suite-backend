import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import type { MasterFuel } from './master-fuel.entity';
import type { MasterFactorVersion } from './master-factor-version.entity';
import type { MasterUnit } from './master-unit.entity';

@Entity({ name: 'master_emission_factors' })
@Index(
  ['fuelId', 'factorVersionId', 'unitId', 'calculationMethod', 'activitySubType', 'geography', 'withRF'],
)
export class MasterEmissionFactor extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  // ─── Foreign keys to existing master tables ──────────────────────────────

  /** FK → master_fuel. Nullable for grid-level EFs (electricity, heat) that
   *  are not tied to a specific fuel type. */
  @Column({ type: 'int', nullable: true })
  fuelId: number | null;

  @ManyToOne('MasterFuel', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'fuelId' })
  masterFuel: MasterFuel;

  /** FK → master_factor_version. Mandatory — locks each EF to its publication year. */
  @Column({ type: 'int' })
  factorVersionId: number;

  @ManyToOne('MasterFactorVersion', { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'factorVersionId' })
  masterFactorVersion: MasterFactorVersion;

  /** FK → master_unit. The denominator unit of this factor (e.g. kg, kWh, pkm). */
  @Column({ type: 'int' })
  unitId: number;

  @ManyToOne('MasterUnit', { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'unitId' })
  masterUnit: MasterUnit;

  // ─── Discriminator dimensions ─────────────────────────────────────────────

  /** Calculation method code, matches MasterFormula.methodCode.
   *  e.g. FUEL_BASED | DISTANCE_BASED | SPEND_EEIO | DISTANCE_WEIGHT | LEAKAGE_RATE */
  @Column({ type: 'varchar', length: 60 })
  calculationMethod: string;

  /** Optional sub-type for multi-variant activities.
   *  e.g. economy | business | first (air cabin class)
   *       short-haul | long-haul | domestic (air route type)
   *       landfill | incineration | recycling (waste treatment) */
  @Column({ type: 'varchar', length: 100, nullable: true })
  activitySubType: string | null;

  /** ISO 3166-1 alpha-2 country code or regional grouping.
   *  e.g. GB | AE | IN | EU | GLOBAL
   *  Null = global / country-agnostic factor. */
  @Column({ type: 'varchar', length: 20, nullable: true })
  geography: string | null;

  /** True when this air-travel factor includes Radiative Forcing uplift.
   *  Only relevant for BT (Business Travel) air sub-categories. */
  @Column({ type: 'boolean', nullable: true, default: false })
  withRF: boolean | null;

  /** IPCC AR basis used for GWP values: AR4 | AR5 | AR6.
   *  Null = not applicable (e.g. pure CO2 combustion). */
  @Column({ type: 'varchar', length: 10, nullable: true })
  gwpBasis: string | null;

  // ─── Factor values (kgCO2e per denominator unit) ──────────────────────────

  /** Total combined emission factor in kgCO2e per unit. Primary calculation input. */
  @Column({ type: 'decimal', precision: 18, scale: 8 })
  factor: number;

  /** CO2 contribution in kgCO2e per unit. */
  @Column({ type: 'decimal', precision: 18, scale: 8, default: 0 })
  co2Factor: number;

  /** CH4 contribution (already multiplied by GWP) in kgCO2e per unit. */
  @Column({ type: 'decimal', precision: 18, scale: 8, default: 0 })
  ch4Factor: number;

  /** N2O contribution (already multiplied by GWP) in kgCO2e per unit. */
  @Column({ type: 'decimal', precision: 18, scale: 8, default: 0 })
  n2oFactor: number;

  /** HFC contribution in kgCO2e per unit. Primarily relevant for fugitive emissions. */
  @Column({ type: 'decimal', precision: 18, scale: 8, default: 0 })
  hfcFactor: number;

  /** PFC contribution in kgCO2e per unit. */
  @Column({ type: 'decimal', precision: 18, scale: 8, default: 0 })
  pfcFactor: number;

  /** SF6 contribution in kgCO2e per unit. */
  @Column({ type: 'decimal', precision: 18, scale: 8, default: 0 })
  sf6Factor: number;

  /** Human-readable description for MDM display.
   *  e.g. "DEFRA 2024 – Natural Gas – Combustion – kg – GB" */
  @Column({ type: 'text', nullable: true })
  description: string | null;

  // ─── Auditable Provenance & Classification Metadata ────────────────────────

  /** Authoritative source publisher (e.g. UK DESNZ / DEFRA, IPCC, US EPA). */
  @Column({ type: 'varchar', length: 100, nullable: true })
  sourcePublisher: string | null;

  /** Dataset name and published version (e.g. UK GHG Conversion Factors 2024). */
  @Column({ type: 'varchar', length: 150, nullable: true })
  datasetNameAndVersion: string | null;

  /** Dataset publication year. */
  @Column({ type: 'int', nullable: true })
  pubYear: number | null;

  /** Document, sheet, worksheet, or table reference in the published source. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  documentSheetTableRef: string | null;

  /** Navigable authoritative URL to the official source publication. */
  @Column({ type: 'text', nullable: true })
  authoritativeSourceUrl: string | null;

  /** Chemical / gas family classification (e.g. HFC, HCFC, HFC Blend, CO2). */
  @Column({ type: 'varchar', length: 50, nullable: true })
  gasFamily: string | null;

  /** Component composition for refrigerant blends (e.g. 50% HFC-32 / 50% HFC-125). */
  @Column({ type: 'text', nullable: true })
  blendComposition: string | null;
}
