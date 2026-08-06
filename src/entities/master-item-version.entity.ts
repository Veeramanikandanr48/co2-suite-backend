import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { MasterItem } from './master-item.entity';

@Entity({ name: 'master_item_versions' })
@Index(['masterItemId', 'version'])
export class MasterItemVersion extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  masterItemId: number;

  @ManyToOne(() => MasterItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'masterItemId' })
  masterItem: MasterItem;

  @Column({ type: 'int' })
  version: number;

  @Column({ type: 'varchar', length: 50 })
  action: string; // 'CREATE' | 'UPDATE' | 'PUBLISH' | 'DEPRECATE' | 'ARCHIVE' | 'RESTORE'

  @Column({ type: 'varchar', nullable: true })
  changeReason: string;

  @Column({ type: 'jsonb' })
  snapshot: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  changes: Record<string, { old: any; new: any }>;

  @Column({ type: 'varchar', nullable: true })
  ipAddress: string;

  @Column({ type: 'varchar', nullable: true })
  userAgent: string;

  @Column({ type: 'varchar', nullable: true })
  correlationId: string;
}
