import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { Organization } from './organization.entity';
import { Service } from './service.entity';

@Entity({ name: 'organization_services' })
export class OrganizationService extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  organizationId: number;

  @Column({ type: 'int' })
  serviceId: number;

  @Column({ nullable: true })
  subscribedBy: number;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @ManyToOne(() => Service)
  @JoinColumn({ name: 'serviceId' })
  service: Service;
}
