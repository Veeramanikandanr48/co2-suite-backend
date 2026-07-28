import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { Service } from './service.entity';

@Entity({ name: 'organization_services' })
export class OrganizationService {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  organizationId: number;

  @Column()
  serviceId: number;

  @Column({ nullable: true })
  subscribedBy: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  subscribedOn: Date;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @ManyToOne(() => Service, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'serviceId' })
  service: Service;
}
