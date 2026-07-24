import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserDetails } from './user.entity';
import { Organization } from './organization.entity';
import { MasterRoles } from './master.entity';

export enum UserOrganizationStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING_INVITE = 'PENDING_INVITE',
}

@Entity({ name: 'user_organizations', schema: 'public' })
export class UserOrganization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'integer' })
  userId: number;

  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'integer', nullable: true })
  roleId?: number;

  @Column({
    type: 'enum',
    enum: UserOrganizationStatusEnum,
    default: UserOrganizationStatusEnum.ACTIVE,
  })
  status: UserOrganizationStatusEnum;

  @Column({ type: 'boolean', default: false })
  isPrimary: boolean;

  @ManyToOne(() => UserDetails, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserDetails;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @ManyToOne(() => MasterRoles, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'roleId' })
  role?: MasterRoles;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
