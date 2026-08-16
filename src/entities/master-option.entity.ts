import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import type { MasterFormField } from './master-form-field.entity';

@Entity({ name: 'master_option' })
export class MasterOption extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  formFieldId: number;

  @ManyToOne('MasterFormField', 'options', { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'formFieldId' })
  masterFormField: MasterFormField;

  /** The stored value sent in the payload, e.g. "boiler" */
  @Column({ type: 'varchar', length: 255 })
  value: string;

  /** The display label shown in the UI, e.g. "Boiler" */
  @Column({ type: 'varchar', length: 255 })
  label: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;
}
