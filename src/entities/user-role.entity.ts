import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserDetails } from './user.entity';
import { MasterRoles } from './master.entity';

@Entity({ name: 'user_roles' })
export class UserRole {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  roleId: number;

  @ManyToOne(() => UserDetails)
  @JoinColumn({ name: 'userId' })
  user: UserDetails;

  @ManyToOne(() => MasterRoles)
  @JoinColumn({ name: 'roleId' })
  role: MasterRoles;

  /**
   * Marks the default active role for users with multiple role assignments.
   * The primary role's roleKey becomes the currentRoleId in the JWT on login.
   */
  @Column({ default: false })
  isPrimary: boolean;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdOn: Date;

  @UpdateDateColumn()
  updatedOn: Date;

  @DeleteDateColumn({ nullable: true })
  deletedOn: Date;
}
