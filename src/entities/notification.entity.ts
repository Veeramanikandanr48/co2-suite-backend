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

@Entity({ name: 'notifications' })
export class Notifications extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  token: string;

  @ManyToOne(() => UserDetails, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  userId: number;

  @Column({ default: 'web' })
  deviceType: string;

  @Column({ default: false })
  enablePushNotification: boolean;

  @Column({ default: true })
  enableInAppNotification: boolean;
}

@Entity({ name: 'notification_history' })
export class NotificationHistory extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  body: string;

  @Column({ nullable: true })
  url: string;

  @Column({ default: false })
  isRead: boolean;

  @ManyToOne(() => Notifications, (notification) => notification.id)
  @JoinColumn({ name: 'userNotificationId' })
  userNotificationId: number;

  @ManyToOne(() => UserDetails, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  userId: number;
}
