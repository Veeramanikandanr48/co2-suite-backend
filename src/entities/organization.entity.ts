import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';

export type OrganizationType = 'Company' | 'BusinessUnit' | 'Division' | 'Subsidiary';

@Entity({ name: 'organizations' })
@Index(['parentOrganizationId'])
export class Organization extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ nullable: true })
  emailDomain: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  postalCode: string;

  @Column({ nullable: true })
  taxId: string;

  @Column({ nullable: true })
  industry: string;

  @Column({ nullable: true })
  timezone: string;

  /**
   * Self-referencing FK for organization hierarchy.
   * Null = top-level Company; non-null = Business Unit / Division / Subsidiary.
   * Supports: Company → Business Unit → Division structure.
   */
  @Column({ type: 'int', nullable: true })
  parentOrganizationId: number;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'parentOrganizationId' })
  parentOrganization: Organization;

  /**
   * Classification of this organization node in the hierarchy.
   * Defaults to 'Company' for root-level organizations.
   */
  @Column({
    type: 'varchar',
    default: 'Company',
    nullable: true,
  })
  type: OrganizationType;
}
