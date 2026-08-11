import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import type { EvidenceCitation } from './evidence-citation.entity';

@Entity({ name: 'source_documents' })
export class SourceDocument extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  documentType: string; // UTILITY_BILL, FUEL_RECEIPT, METER_LOG, CONTRACT, FLIGHT_MANIFEST, FACTOR_SOURCE_GUIDE

  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  @Column({ type: 'varchar', length: 1000 })
  storageUri: string;

  @Column({ type: 'varchar', length: 64 })
  sha256Hash: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  publisher: string;

  @Column({ type: 'date', nullable: true })
  publicationDate: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  version: string;

  @OneToMany('EvidenceCitation', 'sourceDocument')
  citations: EvidenceCitation[];
}
