import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import type { UserDetails } from './user.entity';

export abstract class BaseColumns {
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', nullable: true })
  createdBy: number;

  @ManyToOne('UserDetails', { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  createdByUser: UserDetails;

  @Column({ type: 'int', nullable: true })
  updatedBy: number;

  @ManyToOne('UserDetails', { nullable: true })
  @JoinColumn({ name: 'updatedBy' })
  updatedByUser: UserDetails;

  @Column({ type: 'int', nullable: true })
  deletedBy: number;

  @ManyToOne('UserDetails', { nullable: true })
  @JoinColumn({ name: 'deletedBy' })
  deletedByUser: UserDetails;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date;
}
