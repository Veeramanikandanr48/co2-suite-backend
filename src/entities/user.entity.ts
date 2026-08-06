import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { Organization } from './organization.entity';
import { MasterRoles } from './master.entity';

@Entity({ name: 'user_details' })
export class UserDetails extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  userName: string;

  /**
   * FK to MasterRoles. Default = 3 (USER role).
   * @Index accelerates login and permission lookups.
   */
  @Column({ default: 3 })
  roleId: number;

  @ManyToOne(() => MasterRoles, { nullable: true })
  @JoinColumn({ name: 'roleId' })
  role: MasterRoles;

  @Column({ nullable: true })
  @Index()
  organizationId: number;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ type: 'varchar', nullable: true })
  @Index()
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  googleSubId: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  isTwoFactorAuthenticationEnabled: boolean;

  @Column({ nullable: true })
  twoFactorAuthenticationSecret: string;

  @Column({ type: 'text', nullable: true })
  mfaBackupCodes: string;

  @Column({ nullable: true })
  profileImageKey: string;
}

@Entity({ name: 'user_authentication_details' })
export class UserAuthenticationDetails extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserDetails, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  userId: number;

  @Column({ nullable: true })
  attemptedCount: number;

  @Column({ default: false })
  isBlocked: boolean;

  @Column({ nullable: true })
  blockedTime: Date;

  @Column({ nullable: true })
  masterLoginTypeId: number;
}

@Entity({ name: 'user_email_verification' })
export class UserEmailVerification extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  email: string;

  @Column({ nullable: true })
  otp: string;

  @Column({ nullable: true })
  otpDate: Date;
}
