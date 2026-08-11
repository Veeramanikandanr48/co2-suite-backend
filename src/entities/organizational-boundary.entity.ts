import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import type { BoundaryFacility } from './boundary-facility.entity';

@Entity({ name: 'organizational_boundaries' })
export class OrganizationalBoundary extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  organizationId: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50, default: 'OPERATIONAL_CONTROL' })
  boundaryMethod: string; // OPERATIONAL_CONTROL, FINANCIAL_CONTROL, EQUITY_SHARE

  @Column({ type: 'date' })
  effectiveFrom: string;

  @Column({ type: 'date', nullable: true })
  effectiveTo: string;

  @Column({ type: 'varchar', length: 50, default: 'ACTIVE' })
  status: string;

  @OneToMany('BoundaryFacility', 'boundary')
  boundaryFacilities: BoundaryFacility[];
}
