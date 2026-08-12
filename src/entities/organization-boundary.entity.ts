import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import type { Organization } from './organization.entity';

@Unique('uq_org_boundary_year', ['organizationId', 'reportingYear'])
@Entity({ name: 'organization_boundaries' })
export class OrganizationBoundary extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  organizationId: number;

  @ManyToOne('Organization', { nullable: true })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ type: 'int' })
  reportingYear: number;

  @Column({ type: 'varchar', length: 50, default: 'OPERATIONAL_CONTROL' })
  consolidationApproach: string; // EQUITY_SHARE | OPERATIONAL_CONTROL | FINANCIAL_CONTROL

  @Column({ type: 'varchar', length: 50, default: 'LOCATION_BASED' })
  scope2ReportingBasis: string; // LOCATION_BASED | MARKET_BASED | DUAL

  @Column({ type: 'varchar', length: 255, nullable: true })
  methodologyRegistryRef: string;

  @Column({ type: 'jsonb', nullable: true })
  boundaryJson: Record<string, unknown>; // parent/subsidiaries, ownership %, lease status

  @Column({ type: 'text', nullable: true })
  description: string;
}