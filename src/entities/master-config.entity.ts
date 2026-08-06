import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';

// ============================================================================
// 1. GAS TYPES & GWP VERSIONS
// ============================================================================

@Entity({ name: 'gas_types' })
export class GasType extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  code: string; // e.g. 'CO2', 'CH4', 'N2O', 'SF6', 'HFC', 'PFC', 'NF3'

  @Column({ type: 'varchar', nullable: true })
  name: string; // e.g. 'Carbon Dioxide', 'Methane', 'Nitrous Oxide'

  @Column({ type: 'varchar', nullable: true })
  chemicalFormula: string; // e.g. 'CO₂', 'CH₄', 'N₂O'

  @Column({ type: 'int', default: 0 })
  sortOrder: number;
}

@Entity({ name: 'gwp_versions' })
export class GwpVersion extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  code: string; // e.g. 'AR5', 'AR6', 'AR7'

  @Column({ type: 'varchar', nullable: true })
  name: string; // e.g. 'IPCC Sixth Assessment Report (2021)'

  @Column({ type: 'int', nullable: true })
  publicationYear: number; // e.g. 2021

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @OneToMany(() => GasMultiplier, (m) => m.gwpVersion)
  multipliers: GasMultiplier[];
}

@Entity({ name: 'gas_multipliers' })
@Index(['gwpVersionId', 'gasTypeId'], { unique: true })
export class GasMultiplier extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  gwpVersionId: number;

  @ManyToOne(() => GwpVersion, (v) => v.multipliers)
  @JoinColumn({ name: 'gwpVersionId' })
  gwpVersion: GwpVersion;

  @Column({ type: 'int' })
  gasTypeId: number;

  @ManyToOne(() => GasType)
  @JoinColumn({ name: 'gasTypeId' })
  gasType: GasType;

  @Column({ type: 'float' })
  multiplier: number; // GWP factor value, e.g. 27.9 for CH4 in AR6
}

// ============================================================================
// 2. NORMALIZED EMISSION FACTOR SETS
// ============================================================================

@Entity({ name: 'emission_factor_sets' })
export class EmissionFactorSet extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  name: string; // e.g. 'DEFRA 2026 Emission Factors'

  @Column({ type: 'varchar', nullable: true })
  source: string; // e.g. 'DEFRA', 'IPCC', 'EPA', 'IEA'

  @Column({ type: 'varchar', nullable: true })
  version: string; // e.g. '2026', 'v1.2'

  @Column({ type: 'varchar', nullable: true })
  effectiveFrom: string; // YYYY-MM-DD

  @Column({ type: 'varchar', nullable: true })
  effectiveTo: string; // YYYY-MM-DD

  @Column({ type: 'int', nullable: true })
  tenantId: number; // null = global platform set, non-null = tenant-specific

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @OneToMany(() => EmissionFactorRow, (r) => r.factorSet)
  rows: EmissionFactorRow[];
}

@Entity({ name: 'emission_factor_rows' })
@Index(['factorSetId', 'fuelType', 'unit'])
export class EmissionFactorRow extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  factorSetId: number;

  @ManyToOne(() => EmissionFactorSet, (s) => s.rows)
  @JoinColumn({ name: 'factorSetId' })
  factorSet: EmissionFactorSet;

  @Column({ type: 'varchar', nullable: true })
  fuelType: string; // e.g. 'Diesel', 'Natural Gas', 'Electricity'

  @Column({ type: 'varchar', nullable: true })
  unit: string; // e.g. 'litre', 'sm3', 'kWh'

  @Column({ type: 'varchar', nullable: true })
  activityCategory: string; // e.g. 'Stationary Combustion', 'Mobile Combustion'

  @Column({ type: 'varchar', nullable: true })
  scope: string; // e.g. 'Scope 1', 'Scope 2', 'Scope 3'

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @OneToMany(() => EmissionFactorValue, (v) => v.factorRow)
  values: EmissionFactorValue[];
}

@Entity({ name: 'emission_factor_values' })
@Index(['factorRowId', 'gasTypeId'], { unique: true })
export class EmissionFactorValue extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  factorRowId: number;

  @ManyToOne(() => EmissionFactorRow, (r) => r.values)
  @JoinColumn({ name: 'factorRowId' })
  factorRow: EmissionFactorRow;

  @Column({ type: 'int' })
  gasTypeId: number;

  @ManyToOne(() => GasType)
  @JoinColumn({ name: 'gasTypeId' })
  gasType: GasType;

  @Column({ type: 'float', default: 0 })
  value: number; // e.g. 2.68 kgCO2 per litre

  @Column({ type: 'varchar', default: 'kg' })
  valueUnit: string; // e.g. 'kg', 'g', 'tonne'
}

// ============================================================================
// 3. FORMULA LIBRARY
// ============================================================================

@Entity({ name: 'formula_library' })
export class FormulaLibrary extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  code: string; // e.g. 'ACTIVITY_MULTIPLIER', 'DISTANCE_WEIGHT', 'FUGITIVE_GWP'

  @Column({ type: 'varchar', nullable: true })
  name: string; // e.g. 'Activity Multiplier'

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @Column({ type: 'varchar', default: 'General' })
  category: string; // e.g. 'Combustion', 'Fugitive', 'Transport', 'EEIO'

  @Column({ type: 'boolean', default: false })
  isSystemDefault: boolean;

  @OneToMany(() => FormulaVersion, (v) => v.formulaLibrary)
  versions: FormulaVersion[];
}

@Entity({ name: 'formula_versions' })
export class FormulaVersion extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  formulaLibraryId: number;

  @ManyToOne(() => FormulaLibrary, (f) => f.versions)
  @JoinColumn({ name: 'formulaLibraryId' })
  formulaLibrary: FormulaLibrary;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'varchar', nullable: true })
  expression: string; // e.g. '(amount * factor) / 1000'

  @Column({ type: 'text', nullable: true })
  variables: string; // JSON array string of variable names e.g. '["amount","factor"]'

  @Column({ type: 'varchar', nullable: true })
  effectiveFrom: string;

  @Column({ type: 'boolean', default: true })
  isDefault: boolean;
}

// ============================================================================
// 4. CALCULATION POLICIES
// ============================================================================

@Entity({ name: 'calculation_policies' })
@Index(['organizationId', 'activityCategory'])
export class CalculationPolicy extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  organizationId: number; // null = global policy, non-null = organization-specific policy

  @Column({ type: 'varchar', nullable: true })
  activityCategory: string; // e.g. 'Stationary Combustion'

  @Column({ type: 'int', nullable: true })
  factorSetId: number;

  @ManyToOne(() => EmissionFactorSet)
  @JoinColumn({ name: 'factorSetId' })
  factorSet: EmissionFactorSet;

  @Column({ type: 'int', nullable: true })
  gwpVersionId: number;

  @ManyToOne(() => GwpVersion)
  @JoinColumn({ name: 'gwpVersionId' })
  gwpVersion: GwpVersion;

  @Column({ type: 'int', nullable: true })
  formulaVersionId: number;

  @ManyToOne(() => FormulaVersion)
  @JoinColumn({ name: 'formulaVersionId' })
  formulaVersion: FormulaVersion;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;
}

// ============================================================================
// 5. DYNAMIC FORM FIELDS & NOTIFICATION TEMPLATES
// ============================================================================

@Entity({ name: 'supplementary_field_definitions' })
@Index(['category', 'isActive'])
export class SupplementaryFieldDefinition extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  category: string; // e.g. 'Fugitive Emissions'

  @Column({ type: 'varchar', nullable: true })
  fieldKey: string; // e.g. 'refrigerantGasType'

  @Column({ type: 'varchar', nullable: true })
  label: string; // e.g. 'Refrigerant Gas Type'

  @Column({ type: 'varchar', default: 'text' })
  fieldType: string; // 'text' | 'number' | 'select' | 'boolean' | 'date'

  @Column({ type: 'text', nullable: true })
  options: string; // JSON array of select options e.g. '["R-134a", "R-410A"]'

  @Column({ type: 'boolean', default: false })
  isRequired: boolean;

  @Column({ type: 'varchar', nullable: true })
  defaultValue: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;
}

@Entity({ name: 'notification_templates' })
export class NotificationTemplate extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  code: string; // e.g. 'APPROVAL_PENDING', 'CALCULATION_COMPLETED', 'SLA_BREACHED'

  @Column({ type: 'varchar', nullable: true })
  name: string; // e.g. 'Pending Approval Notification'

  @Column({ type: 'varchar', nullable: true })
  subjectTemplate: string; // e.g. 'Approval Required for {{entryName}}'

  @Column({ type: 'text', nullable: true })
  bodyTemplate: string; // Handlebars / HTML body template

  @Column({ type: 'varchar', default: 'IN_APP' })
  channel: string; // 'EMAIL' | 'IN_APP' | 'WEBSOCKET' | 'FCM'
}
