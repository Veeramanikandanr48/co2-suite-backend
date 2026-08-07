import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { MasterType } from './master-type.entity';

@Entity({ name: 'master_type_statistics' })
export class MasterTypeStatistics extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true })
  masterTypeId: number;

  @OneToOne(() => MasterType, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'masterTypeId' })
  masterType: MasterType;

  @Column({ type: 'int', default: 0 })
  itemCount: number;

  @Column({ type: 'int', default: 0 })
  publishedCount: number;

  @Column({ type: 'int', default: 0 })
  draftCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastUpdated: Date;
}
