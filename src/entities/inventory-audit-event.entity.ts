import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MrvAuditEventTypeEnum, MrvStatusEnum } from 'src/enums/mrv-status.enum';
import type { InventoryEntry } from './inventory-entry.entity';
import type { UserDetails } from './user.entity';

@Entity({ name: 'inventory_audit_events' })
export class InventoryAuditEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  inventoryEntryId: number;

  @ManyToOne('InventoryEntry', 'auditEvents', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inventoryEntryId' })
  inventoryEntry: InventoryEntry;

  @Index()
  @Column({ type: 'int' })
  organizationId: number;

  @Column({
    type: 'varchar',
    length: 50,
  })
  eventType: MrvAuditEventTypeEnum;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  previousStatus: MrvStatusEnum | null;

  @Column({
    type: 'varchar',
    length: 50,
  })
  newStatus: MrvStatusEnum;

  @Column({ type: 'int' })
  actorId: number;

  @ManyToOne('UserDetails', { nullable: true })
  @JoinColumn({ name: 'actorId' })
  actorUser: UserDetails;

  @Column({ type: 'varchar', length: 255, nullable: true })
  actorEmail: string | null;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  /** Cryptographic hash of any attached proof/evidence at the time of this event */
  @Column({ type: 'varchar', length: 64, nullable: true })
  evidenceSha256: string | null;

  /** Snapshot of formula and parameters used for calculation */
  @Column({ type: 'json', nullable: true })
  formulaSnapshot: Record<string, any> | null;

  /** Snapshot of emission factor value, provenance, and source at audit time */
  @Column({ type: 'json', nullable: true })
  factorSnapshot: Record<string, any> | null;

  /** Additional contextual metadata */
  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
