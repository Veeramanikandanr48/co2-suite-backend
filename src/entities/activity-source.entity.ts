import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { InventoryActivity } from './inventory-activity.entity';
import { SourceDocument } from './source-document.entity';
import { EvidenceCitation } from './evidence-citation.entity';

@Entity({ name: 'activity_sources' })
export class ActivitySource extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  activityId: number;

  @ManyToOne(() => InventoryActivity, (a) => a.sources, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activityId' })
  activity: InventoryActivity;

  @Column({ type: 'int' })
  sourceDocumentId: number;

  @ManyToOne(() => SourceDocument, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sourceDocumentId' })
  sourceDocument: SourceDocument;

  @Column({ type: 'int', nullable: true })
  evidenceCitationId: number;

  @ManyToOne(() => EvidenceCitation, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'evidenceCitationId' })
  evidenceCitation: EvidenceCitation;

  @Column({ type: 'varchar', length: 50, default: 'SUPPORTING_INVOICE' })
  attachmentType: string;
}
