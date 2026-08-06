import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';

export enum MasterSchemaStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  DEPRECATED = 'DEPRECATED',
}

@Entity({ name: 'master_schemas' })
@Index(['name', 'version'], { unique: true })
export class MasterSchema extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @Column({ type: 'jsonb' })
  jsonSchema: Record<string, any>;

  @Column({ type: 'varchar', length: 50, default: MasterSchemaStatus.ACTIVE })
  status: MasterSchemaStatus;
}
