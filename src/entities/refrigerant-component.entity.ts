import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { MasterRefrigerant } from './master-refrigerant.entity';
import { MasterGas } from './master-gas.entity';

@Entity({ name: 'refrigerant_components' })
@Unique(['refrigerantId', 'gasId'])
export class RefrigerantComponent extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  refrigerantId: number;

  @ManyToOne(() => MasterRefrigerant, (r) => r.components, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'refrigerantId' })
  refrigerant: MasterRefrigerant;

  @Column({ type: 'int' })
  gasId: number;

  @ManyToOne(() => MasterGas, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'gasId' })
  gas: MasterGas;

  @Column({ type: 'decimal', precision: 6, scale: 3 })
  massPercentage: number; // e.g. 50.000 for HFC-32 in R410A
}
