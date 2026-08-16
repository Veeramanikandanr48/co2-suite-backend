import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import type { MasterFormField } from './master-form-field.entity';

@Entity({ name: 'master_category' })
export class MasterCategory extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  scope: string; // e.g. 'Scope 1', 'Scope 2', 'Scope 3'

  @Column({ type: 'int', nullable: true })
  scopeId: number;

  @Column({ type: 'varchar', length: 255 })
  name: string; // e.g. 'Stationary Combustion'

  @Column({ type: 'varchar', length: 50, nullable: true })
  code: string; // e.g. 'SC'

  @Column({ type: 'text', nullable: true })
  description: string;

  /**
   * Cached computed form schema — auto-rebuilt from master_form_field + master_option rows.
   * Do NOT edit this directly; use the Form Builder API instead.
   */
  @Column({ type: 'json', nullable: true })
  formConfig: any;

  @OneToMany('MasterFormField', 'masterCategory', { cascade: false, eager: false })
  formFields: MasterFormField[];
}
