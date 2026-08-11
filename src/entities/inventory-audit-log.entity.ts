import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';

export type InventoryAuditAction = 'CREATE' | 'UPDATE' | 'DEACTIVATE';

@Entity({ name: 'inventory_audit_logs' })
export class InventoryAuditLog extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int', nullable: false })
  inventoryEntryId: number;

  @Index()
  @Column({ type: 'int', nullable: false })
  organizationId: number;

  @Column({ type: 'varchar', length: 50, nullable: false })
  action: InventoryAuditAction;

  @Column({ type: 'int', nullable: false })
  changedBy: number;

  @Column({ type: 'varchar', length: 20, default: '1.0.0' })
  calculationEngineVersion: string;

  @Column({ type: 'json', nullable: true })
  beforeSnapshot: Record<string, any>;

  @Column({ type: 'json', nullable: false })
  afterSnapshot: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  changeReason: string;
}
