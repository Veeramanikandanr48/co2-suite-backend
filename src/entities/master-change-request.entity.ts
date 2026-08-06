import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { MasterItem } from './master-item.entity';

export enum ChangeRequestStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PUBLISHED = 'PUBLISHED',
}

@Entity({ name: 'master_change_requests' })
@Index(['status'])
export class MasterChangeRequest extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  masterItemId: number;

  @ManyToOne(() => MasterItem, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'masterItemId' })
  masterItem: MasterItem;

  @Column({ type: 'varchar', length: 50 })
  actionType: string; // 'CREATE' | 'UPDATE' | 'DEPRECATE' | 'ARCHIVE'

  @Column({ type: 'varchar', length: 50, default: ChangeRequestStatus.SUBMITTED })
  status: ChangeRequestStatus;

  @Column({ type: 'jsonb' })
  proposedChanges: Record<string, any>;

  @Column({ type: 'varchar', nullable: true })
  requestReason: string;

  @Column({ type: 'varchar', nullable: true })
  reviewerComments: string;

  @Column({ type: 'int', nullable: true })
  reviewedBy: number;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;
}
