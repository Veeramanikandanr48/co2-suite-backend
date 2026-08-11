import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { EmissionFactor } from './emission-factor.entity';
import { MasterGas } from './master-gas.entity';

@Entity({ name: 'emission_factor_components' })
@Unique(['emissionFactorId', 'gasId'])
export class EmissionFactorComponent extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  emissionFactorId: number;

  @ManyToOne(() => EmissionFactor, (ef) => ef.components, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'emissionFactorId' })
  emissionFactor: EmissionFactor;

  @Column({ type: 'int' })
  gasId: number;

  @ManyToOne(() => MasterGas, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'gasId' })
  gas: MasterGas;

  @Column({ type: 'decimal', precision: 18, scale: 10 })
  componentValue: number;

  @Column({ type: 'int' })
  componentUnitId: number;

  @Column({ type: 'varchar', length: 50, default: 'GAS_MASS' })
  basis: string; // GAS_MASS, CO2E_COMPONENT

  @Column({ type: 'int', nullable: true })
  gwpId: number;
}
