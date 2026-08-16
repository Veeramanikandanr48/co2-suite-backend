import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import type { MasterCategory } from './master-category.entity';
import type { MasterOption } from './master-option.entity';

export type FormFieldType = 'text' | 'number' | 'select' | 'radio' | 'textarea';

@Entity({ name: 'master_form_field' })
export class MasterFormField extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  categoryId: number;

  @ManyToOne('MasterCategory', 'formFields', { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  masterCategory: MasterCategory;

  /** The unique form field key used in the payload, e.g. "inventoryName", "amount" */
  @Column({ type: 'varchar', length: 100 })
  key: string;

  /** Human-readable label shown in the form, e.g. "Activity Data Amount" */
  @Column({ type: 'varchar', length: 255 })
  label: string;

  /** Field input type */
  @Column({ type: 'varchar', length: 20, default: 'text' })
  type: FormFieldType;

  /** Optional placeholder text */
  @Column({ type: 'varchar', length: 255, nullable: true })
  placeholder: string;

  /** Optional display unit suffix, e.g. "L", "kg", "kWh" */
  @Column({ type: 'varchar', length: 50, nullable: true })
  unit: string;

  /**
   * For select/radio fields whose options come from a master table
   * rather than the master_option table.
   * Allowed values: 'fuels' | 'units' | null
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  optionsSource: string;

  @Column({ type: 'boolean', default: false })
  required: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @OneToMany('MasterOption', 'masterFormField', { cascade: true, eager: false })
  options: MasterOption[];
}
