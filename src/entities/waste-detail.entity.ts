import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { Scope3Activity } from './scope3-activity.entity';

@Entity({ name: 'waste_details' })
export class WasteDetail extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true })
  scope3ActivityId: number;

  @OneToOne(() => Scope3Activity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'scope3ActivityId' })
  scope3Activity: Scope3Activity;

  @Column({ type: 'varchar', length: 100 })
  wasteType: string; // MUNICIPAL_SOLID, PLASTIC, FOOD, PAPER, HAZARDOUS, E_WASTE

  @Column({ type: 'varchar', length: 50 })
  disposalMethod: string; // LANDFILL, OPEN_DUMP, RECYCLING, COMPOSTING, INCINERATION_ENERGY, INCINERATION_NO_ENERGY

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  wasteMassTonnes: number;
}
