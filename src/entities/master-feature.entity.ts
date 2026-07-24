import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MasterModule } from './master-module.entity';

@Entity({ name: 'master_features', schema: 'public' })
export class MasterFeature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  moduleId: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  featureKey: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  route?: string;

  @Column({ type: 'varchar', length: 50, default: 'FileText' })
  icon: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  permissionKey?: string;

  @Column({ type: 'integer', default: 1 })
  sortOrder: number;

  @ManyToOne(() => MasterModule, (mod) => mod.features, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'moduleId' })
  module: MasterModule;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
