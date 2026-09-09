import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';

@Entity({ name: 'master_entities' })
@Index(['entityType', 'code'], { unique: true })
export class MasterEntity extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'varchar', length: 50 })
  entityType: string;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status: string;

  @Column({ type: 'int', nullable: true })
  organizationId: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;
}
