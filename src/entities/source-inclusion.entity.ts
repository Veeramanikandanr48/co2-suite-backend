import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import type { Organization } from './organization.entity';

@Index('idx_source_inclusion_org_year', ['organizationId', 'reportingYear'])
@Entity({ name: 'source_inclusions' })
export class SourceInclusion extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  organizationId: number;

  @ManyToOne('Organization', { nullable: true })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ type: 'int' })
  reportingYear: number;

  @Column({ type: 'int', nullable: true })
  scopeId: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  category: string;

  @Column({ type: 'varchar', length: 255 })
  sourceKey: string;

  @Column({ type: 'varchar', length: 50, default: 'INCLUDED' })
  inclusionStatus: string; // INCLUDED | EXCLUDED | NOT_APPLICABLE | PENDING_REVIEW

  @Column({ type: 'text', nullable: true })
  exclusionReason: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  boundaryBasis: string;

  @Column({ type: 'int', nullable: true })
  reviewerId: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  reviewDate: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  evidenceRef: string;

  @Column({ type: 'text', nullable: true })
  materialityRationale: string;
}