import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { MasterItem } from './master-item.entity';
import { FormulaRevision } from './formula-revision.entity';
import { EmissionFactorMetadata } from './emission-factor-metadata.entity';
import { EmissionFactorGas } from './emission-factor-gas.entity';

@Entity({ name: 'emission_factors' })
@Index(
  [
    'organizationId',
    'scopeId',
    'activityCategoryId',
    'fuelGasTypeId',
    'measurementUnitId',
    'countryId',
    'regionId',
    'factorSourceId',
    'factorVersionId',
    'effectiveFrom',
    'priority',
  ],
  { unique: true },
)
@Index(['lookupHash'])
export class EmissionFactor extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  /** Precomputed SHA-256 hash of the composite lookup key for single-column B-tree queries */
  @Column({ type: 'varchar', length: 64, nullable: true })
  lookupHash: string;

  @Column({ type: 'int', nullable: true })
  organizationId: number;

  // Master References (Foreign Keys)
  @Column({ nullable: true })
  scopeId: number;

  @ManyToOne(() => MasterItem, { nullable: true, onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'scopeId' })
  scopeItem: MasterItem;

  @Column({ nullable: true })
  activityCategoryId: number;

  @ManyToOne(() => MasterItem, { nullable: true, onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'activityCategoryId' })
  activityCategoryItem: MasterItem;

  @Column({ nullable: true })
  fuelGasTypeId: number;

  @ManyToOne(() => MasterItem, { nullable: true, onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'fuelGasTypeId' })
  fuelGasTypeItem: MasterItem;

  @Column({ nullable: true })
  measurementUnitId: number;

  @ManyToOne(() => MasterItem, { nullable: true, onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'measurementUnitId' })
  measurementUnitItem: MasterItem;

  @Column({ nullable: true })
  countryId: number;

  @ManyToOne(() => MasterItem, { nullable: true, onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'countryId' })
  countryItem: MasterItem;

  @Column({ nullable: true })
  regionId: number;

  @ManyToOne(() => MasterItem, { nullable: true, onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'regionId' })
  regionItem: MasterItem;

  @Column({ nullable: true })
  factorSourceId: number;

  @ManyToOne(() => MasterItem, { nullable: true, onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'factorSourceId' })
  factorSourceItem: MasterItem;

  @Column({ nullable: true })
  factorVersionId: number;

  @ManyToOne(() => MasterItem, { nullable: true, onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'factorVersionId' })
  factorVersionItem: MasterItem;

  @Column({ nullable: true })
  formulaRevisionId: number;

  @ManyToOne(() => FormulaRevision, { nullable: true, onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'formulaRevisionId' })
  formulaRevisionItem: FormulaRevision;

  // Resolution Priority Rule (1 = Company Specific, 2 = Supplier Specific, 3 = Regional, 4 = Country, 5 = Global Default)
  @Column({ type: 'int', default: 3 })
  priority: number;

  // High-Precision Total Emission Factor Rate
  @Column('decimal', { precision: 18, scale: 8, default: 1.0 })
  totalEmissionFactor: number;

  // Optional Direct Rates for Common Gases
  @Column('decimal', { precision: 18, scale: 8, nullable: true })
  co2: number;

  @Column('decimal', { precision: 18, scale: 8, nullable: true })
  ch4: number;

  @Column('decimal', { precision: 18, scale: 8, nullable: true })
  n2o: number;

  @Column('decimal', { precision: 18, scale: 8, nullable: true })
  co2e: number;

  // Normalized Greenhouse Gas Breakdown Values
  @OneToMany(() => EmissionFactorGas, (gas) => gas.emissionFactor, { cascade: true, eager: true })
  gases: EmissionFactorGas[];

  // Validity Date Range
  @Column({ type: 'varchar', nullable: true })
  effectiveFrom: string;

  @Column({ type: 'varchar', nullable: true })
  effectiveTo: string;

  // One-to-One Relation to Extended Audit & Provenance Metadata
  @OneToOne(() => EmissionFactorMetadata, (meta) => meta.emissionFactor, { cascade: true })
  metadata: EmissionFactorMetadata;

  // Alias getter/setter for factor for backward compatibility
  get factor(): number {
    return this.totalEmissionFactor;
  }
  set factor(val: number) {
    this.totalEmissionFactor = val;
  }

  // Private Backing Fields for Legacy Setters
  private _scope?: string;
  private _category?: string;
  private _fuelOrGasType?: string;
  private _unit?: string;
  private _country?: string;
  private _region?: string;
  private _source?: string;
  private _version?: string;
  private _formula?: string;
  private _status?: string;

  get status(): string {
    return this._status || (this.isActive ? 'PUBLISHED' : 'DEPRECATED');
  }
  set status(val: string) {
    this._status = val;
  }

  get scope(): string {
    return this._scope || this.scopeItem?.name || 'Scope 1';
  }
  set scope(val: string) {
    this._scope = val;
  }

  get category(): string {
    return this._category || this.activityCategoryItem?.name || '';
  }
  set category(val: string) {
    this._category = val;
  }

  get fuelOrGasType(): string {
    return this._fuelOrGasType || this.fuelGasTypeItem?.name || '';
  }
  set fuelOrGasType(val: string) {
    this._fuelOrGasType = val;
  }

  get unit(): string {
    return this._unit || this.measurementUnitItem?.name || 'sm3';
  }
  set unit(val: string) {
    this._unit = val;
  }

  get country(): string {
    return this._country || this.countryItem?.name || '';
  }
  set country(val: string) {
    this._country = val;
  }

  get region(): string {
    return this._region || this.regionItem?.name || '';
  }
  set region(val: string) {
    this._region = val;
  }

  get source(): string {
    return this._source || this.factorSourceItem?.name || '';
  }
  set source(val: string) {
    this._source = val;
  }

  get version(): string {
    return this._version || this.factorVersionItem?.name || 'AR6';
  }
  set version(val: string) {
    this._version = val;
  }

  get formula(): string {
    return this._formula || this.formulaRevisionItem?.expression || '(amount * factor) / 1000';
  }
  set formula(val: string) {
    this._formula = val;
  }
}
