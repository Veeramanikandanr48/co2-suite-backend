import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';

@Entity({ name: 'master_schema_definitions' })
@Index(['entityType', 'attributeKey'], { unique: true })
export class MasterSchemaDefinition extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'varchar', length: 50 })
  entityType: string;

  @Column({ type: 'varchar', length: 100 })
  attributeKey: string;

  @Column({ type: 'varchar', length: 255 })
  attributeLabel: string;

  @Column({ type: 'varchar', length: 30 })
  dataType: string; // 'text', 'number', 'select', 'boolean', 'textarea'

  @Column({ type: 'boolean', default: false })
  isRequired: boolean;

  @Column({ type: 'jsonb', default: [] })
  optionsList: any[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  validationRegex: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;
}
