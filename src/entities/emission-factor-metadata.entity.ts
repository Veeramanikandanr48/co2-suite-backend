import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { EmissionFactor } from './emission-factor.entity';

@Entity({ name: 'emission_factor_metadata' })
export class EmissionFactorMetadata extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  emissionFactorId: number;

  @OneToOne(() => EmissionFactor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'emissionFactorId' })
  emissionFactor: EmissionFactor;

  @Column({ type: 'varchar', nullable: true, default: 'TIER_1' })
  dataQuality: string; // TIER_1, TIER_2, TIER_3, MEASURED, ESTIMATED, SUPPLIER_SPECIFIC

  @Column('decimal', { precision: 5, scale: 2, nullable: true, default: 95.0 })
  confidenceScore: number;

  @Column({ type: 'varchar', nullable: true })
  sourcePublisher: string;

  @Column({ type: 'varchar', nullable: true })
  sourceDocument: string;

  @Column({ type: 'varchar', nullable: true })
  citation: string;

  @Column({ type: 'varchar', nullable: true })
  referenceUrl: string;

  @Column({ type: 'varchar', nullable: true })
  license: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'varchar', nullable: true })
  reviewedBy: string;

  @Column({ type: 'text', nullable: true })
  reviewComment: string;

  @Column({ type: 'varchar', nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'int', default: 1 })
  revision: number;
}
