import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';

@Entity({ name: 'inventory_entries' })
export class InventoryEntry extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  organizationId: number;

  @Column({ type: 'int', nullable: true })
  reportingPeriodId: number;

  @Column({ type: 'int', nullable: true })
  reportingPeriodYear: number;

  @Column({ type: 'varchar', length: 150, nullable: true })
  reportingPeriodName: string;

  @Column({ default: 'CARBON' })
  serviceCode: string;

  @Column({ type: 'varchar' })
  category: string; // e.g. 'Stationary Combustion'

  @Column({ type: 'varchar' })
  name: string; // e.g. 'Natural Gas'

  @Column({ type: 'float', default: 0 })
  amount: number;

  @Column({ type: 'varchar', nullable: true })
  unit: string;

  /** Raw user entered activity amount before physical unit normalization */
  @Column({ type: 'float', nullable: true })
  originalAmount: number;

  /** Raw user entered activity unit before physical unit normalization */
  @Column({ type: 'varchar', nullable: true })
  originalUnit: string;

  /** Converted activity amount matching EF denominator unit */
  @Column({ type: 'float', nullable: true })
  normalizedAmount: number;

  /** Converted activity unit matching EF denominator unit */
  @Column({ type: 'varchar', nullable: true })
  normalizedUnit: string;

  /** Emission factor snapshot in kg CO₂e / unit */
  @Column({ type: 'float', default: 0 })
  ef: number;

  @Column({ type: 'varchar', nullable: true })
  efSource: string;

  @Column({ type: 'varchar', nullable: true })
  dateFrom: string;

  @Column({ type: 'varchar', nullable: true })
  dateTo: string;

  @Column({ type: 'varchar', nullable: true })
  facility: string;

  /** Total calculated greenhouse gas emission snapshot in metric tonnes CO₂e (tCO₂e) */
  @Column({ type: 'float', default: 0 })
  emission: number;

  /** Biogenic CO₂ emissions snapshot in metric tonnes CO₂ (tCO₂) reported as memo item */
  @Column({ type: 'float', default: 0, nullable: true })
  biogenicEmission: number;

  /** Biogenic carbon classification flag */
  @Column({ type: 'boolean', default: false })
  isBiogenic: boolean;

  /** Fugitive / process emission calculation mode (DIRECT_RELEASE, RECHARGE_TOPUP, INVENTORY_DIFFERENCE, ESTIMATED_LEAKAGE) */
  @Column({ type: 'varchar', length: 50, nullable: true })
  emissionMode: string;

  /** Vehicle / Asset ownership status for Scope 1 vs Scope 3 boundary verification */
  @Column({ type: 'varchar', length: 50, nullable: true })
  ownershipControl: string;

  /** Scope Classification snapshot (SCOPE_1, SCOPE_2, SCOPE_3) */
  @Column({ type: 'varchar', length: 50, nullable: true })
  scopeType: string;

  /** Scope 3 Category Number snapshot (1-15) */
  @Column({ type: 'int', nullable: true })
  scope3CategoryNumber: number;

  /** Calculation methodology snapshot (FUEL_BASED, DISTANCE_BASED, SPEND_BASED, etc.) */
  @Column({ type: 'varchar', length: 100, nullable: true })
  calculationMethod: string;

  /** Engine algorithm version snapshot (e.g. 1.0.0) */
  @Column({ type: 'varchar', length: 20, default: '1.0.0' })
  calculationEngineVersion: string;

  /** Granular Activity Type Code snapshot (e.g. CAT7_COMMUTING, CAT6_AIR) */
  @Column({ type: 'varchar', length: 100, nullable: true })
  activityTypeCode: string;

  /** Radiative Forcing status for aviation (WITH_RF, WITHOUT_RF) */
  @Column({ type: 'varchar', length: 50, nullable: true })
  radiativeForcingType: string;

  /** Emission factor classification (CO2E, GAS_SPECIFIC) */
  @Column({ type: 'varchar', length: 50, default: 'CO2E' })
  efType: string;

  /** Emission factor basis (CO2E_TOTAL, CO2E_COMPONENT, GAS_MASS) */
  @Column({ type: 'varchar', length: 50, default: 'CO2E_TOTAL' })
  factorBasis: string;

  /** Factor Dataset Name (e.g. DEFRA 2025, EPA 2024, IEA 2023) */
  @Column({ type: 'varchar', length: 150, nullable: true })
  factorDataset: string;

  /** Factor Dataset Version */
  @Column({ type: 'varchar', length: 50, nullable: true })
  factorVersion: string;

  /** Factor Dataset Reporting Year */
  @Column({ type: 'varchar', length: 20, nullable: true })
  factorYear: string;

  /** Methane origin classification (FOSSIL, NON_FOSSIL) */
  @Column({ type: 'varchar', length: 50, nullable: true })
  ch4Origin: string;

  /** GWP Source & Version snapshot (e.g. IPCC AR6, IPCC AR5) */
  @Column({ type: 'varchar', length: 100, nullable: true })
  gwpSource: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  gwpVersion: string;

  /** GWP Time Horizon (e.g. 100Y, 20Y) */
  @Column({ type: 'varchar', length: 50, nullable: true, default: '100Y' })
  gwpHorizon: string;

  /** Immutable JSON snapshot of exact GWP values used (e.g. { CO2: 1, CH4: 29.8, N2O: 273 }) */
  @Column({ type: 'json', nullable: true })
  gwpValuesSnapshot: Record<string, any>;

  /** Gas breakdown availability flag */
  @Column({ type: 'boolean', default: false })
  gasBreakdownAvailable: boolean;

  /** Gas species emissions snapshot breakdown (tCO₂e) - nullable when unavailable */
  @Column({ type: 'float', nullable: true })
  gasCO2: number;

  @Column({ type: 'float', nullable: true })
  gasCH4: number;

  @Column({ type: 'float', nullable: true })
  gasN2O: number;

  @Column({ type: 'float', nullable: true })
  gasHFC: number;

  @Column({ type: 'float', nullable: true })
  gasPFC: number;

  @Column({ type: 'float', nullable: true })
  gasSF6: number;

  @Column({ type: 'float', nullable: true })
  gasNF3: number;

  /** Flexible structured snapshot for category-specific calculation inputs (employeeCount, travelDays, transportMode, etc.) */
  @Column({ type: 'json', nullable: true })
  methodologyInputsSnapshot: Record<string, any>;

  @Column({ default: 'completed' })
  status: string; // 'completed', 'pending', 'draft'

  @Column({ type: 'varchar', nullable: true })
  comment: string;

  @Column({ type: 'varchar', nullable: true })
  approvalStatus: string;

  @Column({ type: 'varchar', nullable: true })
  documentPath: string;
}
