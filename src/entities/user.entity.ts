import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { PrimaryGeneratedColumn } from 'typeorm';

export class BaseColumns {
  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => UserDetails, (user) => user.id)
  @JoinColumn({ name: 'createdBy' })
  createdBy: number;

  @ManyToOne(() => UserDetails, (user) => user.id, { nullable: true })
  @JoinColumn({ name: 'updatedBy' })
  updatedBy: number;

  @ManyToOne(() => UserDetails, (user) => user.id, { nullable: true })
  @JoinColumn({ name: 'deletedBy' })
  deletedBy: number;

  @CreateDateColumn()
  createdOn: Date;

  @UpdateDateColumn()
  updatedOn: Date;

  @DeleteDateColumn({ nullable: true })
  deletedOn: Date;
}

@Entity({ name: 'user_details' })
export class UserDetails {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  userName: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  googleSubId: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  isTwoFactorAuthenticationEnabled: boolean;

  @Column({ nullable: true })
  twoFactorAuthenticationSecret: string;

  @Column({ nullable: true })
  profileImageKey: string;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
  updatedBy: number;

  @Column({ nullable: true })
  deletedBy: number;

  @CreateDateColumn()
  createdOn: Date;

  @UpdateDateColumn()
  updatedOn: Date;

  @DeleteDateColumn()
  deletedOn: Date;
}

@Entity({ name: 'user_authentication_details' })
export class UserAuthenticationDetails {
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

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
  updatedBy: number;

  @Column({ nullable: true })
  deletedBy: number;

  @CreateDateColumn()
  createdOn: Date;

  @UpdateDateColumn()
  updatedOn: Date;

  @DeleteDateColumn()
  deletedOn: Date;
}

@Entity({ name: 'user_email_verification' })
export class UserEmailVerification extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column({ nullable: true })
  otp: string;

  @Column({ nullable: true })
  otpDate: Date;
}
