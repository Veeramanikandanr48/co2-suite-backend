import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { MasterItem } from './master-item.entity';

@Entity({ name: 'master_item_metadata' })
export class MasterItemMetadata extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true })
  masterItemId: number;

  @OneToOne(() => MasterItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'masterItemId' })
  masterItem: MasterItem;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @Column({ type: 'varchar', nullable: true, length: 50 })
  icon: string;

  @Column({ type: 'varchar', nullable: true, length: 30 })
  color: string;

  @Column({ type: 'int', default: 1 })
  schemaVersion: number;

  @Column({ type: 'jsonb', nullable: true })
  attributes: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  customAttributes: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  tags: string[];

  @Column({ type: 'jsonb', nullable: true })
  translations: Record<string, { name?: string; description?: string }>;
}
