import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { SourceDocument } from './source-document.entity';

@Entity({ name: 'evidence_citations' })
export class EvidenceCitation extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  sourceDocumentId: number;

  @ManyToOne(() => SourceDocument, (doc) => doc.citations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sourceDocumentId' })
  sourceDocument: SourceDocument;

  @Column({ type: 'int', nullable: true })
  pageNumber: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sectionName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  tableReference: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  rowReference: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  columnReference: string;

  @Column({ type: 'decimal', precision: 18, scale: 10, nullable: true })
  quotedValue: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  quotedUnit: string;

  @Column({ type: 'varchar', length: 50, default: 'UNVERIFIED' })
  verificationStatus: string; // UNVERIFIED, VERIFIED, REJECTED

  @Column({ type: 'int', nullable: true })
  verifiedBy: number;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;
}
