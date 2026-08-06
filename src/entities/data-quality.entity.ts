import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { InventoryEntry } from './inventory-entry.entity';

export enum RuleSeverity {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
}

export enum RuleValidationStatus {
  PASS = 'PASS',
  WARN = 'WARN',
  FAIL = 'FAIL',
}

export enum ConfidenceLevel {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

@Entity({ name: 'data_quality_rules' })
export class DataQualityRule extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  code: string; // e.g. 'REQ_AMOUNT', 'EF_MATCH_CHECK', 'UNIT_MATCH_CHECK', 'OUTLIER_CHECK'

  @Column({ type: 'varchar', nullable: true })
  name: string; // e.g. 'Required Amount Check'

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @Column({ type: 'varchar', nullable: true })
  ruleType: string; // 'REQUIRED_FIELD' | 'EF_LOOKUP' | 'UNIT_MATCH' | 'OUTLIER' | 'DUPLICATE'

  @Column({
    type: 'enum',
    enum: RuleSeverity,
    default: RuleSeverity.WARN,
  })
  severity: RuleSeverity;

  @Column({ type: 'varchar', nullable: true })
  expression: string; // Evaluation rule expression string

  @Column({ type: 'int', default: 10 })
  scoreDeduction: number; // Deduction from 100 if rule fails or warns
}

@Entity({ name: 'data_quality_results' })
@Index(['inventoryEntryId'])
export class DataQualityResult extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  inventoryEntryId: number;

  @ManyToOne(() => InventoryEntry, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'inventoryEntryId' })
  inventoryEntry: InventoryEntry;

  @Column({ type: 'int', nullable: true })
  ruleId: number;

  @ManyToOne(() => DataQualityRule, { nullable: true })
  @JoinColumn({ name: 'ruleId' })
  rule: DataQualityRule;

  @Column({ type: 'varchar', nullable: true })
  ruleCode: string;

  @Column({
    type: 'enum',
    enum: RuleValidationStatus,
    default: RuleValidationStatus.PASS,
  })
  status: RuleValidationStatus;

  @Column({ type: 'varchar', nullable: true })
  message: string;

  @Column({ type: 'text', nullable: true })
  detailsJson: string;
}

@Entity({ name: 'data_quality_scores' })
@Index(['inventoryEntryId'], { unique: true })
@Index(['organizationId'])
export class DataQualityScore extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  inventoryEntryId: number;

  @ManyToOne(() => InventoryEntry, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'inventoryEntryId' })
  inventoryEntry: InventoryEntry;

  @Column({ type: 'int', nullable: true })
  organizationId: number;

  @Column({ type: 'float', default: 100 })
  score: number; // 0 to 100 confidence score

  @Column({
    type: 'enum',
    enum: ConfidenceLevel,
    default: ConfidenceLevel.HIGH,
  })
  confidenceLevel: ConfidenceLevel;

  @Column({ type: 'int', default: 0 })
  passedRulesCount: number;

  @Column({ type: 'int', default: 0 })
  failedRulesCount: number;

  @Column({ type: 'int', default: 0 })
  warningRulesCount: number;
}

@Entity({ name: 'activity_supplementary_values' })
@Index(['inventoryEntryId', 'fieldKey'], { unique: true })
export class ActivitySupplementaryValue extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  inventoryEntryId: number;

  @ManyToOne(() => InventoryEntry, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'inventoryEntryId' })
  inventoryEntry: InventoryEntry;

  @Column({ type: 'int', nullable: true })
  fieldDefinitionId: number;

  @Column({ type: 'varchar', nullable: true })
  fieldKey: string;

  @Column({ type: 'text', nullable: true })
  value: string;
}
