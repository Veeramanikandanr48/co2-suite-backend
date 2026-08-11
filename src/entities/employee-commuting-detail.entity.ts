import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { Scope3Activity } from './scope3-activity.entity';

@Entity({ name: 'employee_commuting_details' })
export class EmployeeCommutingDetail extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true })
  scope3ActivityId: number;

  @OneToOne(() => Scope3Activity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'scope3ActivityId' })
  scope3Activity: Scope3Activity;

  @Column({ type: 'varchar', length: 50 })
  commuteMode: string; // CAR, BUS, TRAIN, SUBWAY, BICYCLE, WALKING, TELEWORK

  @Column({ type: 'int', default: 1 })
  employeeCount: number;

  @Column({ type: 'int', default: 240 })
  workingDaysPerYear: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  teleworkPct: number;
}
