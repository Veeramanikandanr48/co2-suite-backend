import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import type { MasterFactorVersion } from './master-factor-version.entity';
import type { MasterFuel } from './master-fuel.entity';

@Entity({ name: 'version_fuel_mapping' })
export class VersionFuelMapping extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  factorVersionId: number;

  @ManyToOne('MasterFactorVersion', 'fuelMappings', { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'factorVersionId' })
  masterFactorVersion: MasterFactorVersion;

  @Column({ type: 'int', nullable: true })
  fuelId: number;

  @ManyToOne('MasterFuel', 'versionMappings', { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fuelId' })
  masterFuel: MasterFuel;

  @Column({ type: 'text', nullable: true })
  description: string;
}
