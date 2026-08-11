import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { InventoryActivity } from './inventory-activity.entity';
import { MasterEnergyType } from './master-energy-type.entity';
import { EnergySupplyContract } from './energy-supply-contract.entity';

@Entity({ name: 'purchased_energy_activities' })
export class PurchasedEnergyActivity extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true })
  activityId: number;

  @OneToOne(() => InventoryActivity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activityId' })
  activity: InventoryActivity;

  @Column({ type: 'int' })
  energyTypeId: number;

  @ManyToOne(() => MasterEnergyType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'energyTypeId' })
  energyType: MasterEnergyType;

  @Column({ type: 'int', nullable: true })
  contractId: number;

  @ManyToOne(() => EnergySupplyContract, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'contractId' })
  contract: EnergySupplyContract;

  @Column({ type: 'varchar', length: 100, nullable: true })
  meterReference: string;
}
