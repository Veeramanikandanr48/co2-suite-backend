import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';

@Entity({ name: 'services' })
export class Service extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true })
  code: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @Column({ type: 'varchar', nullable: true })
  category: string;

  /**
   * JSON array of badge labels shown on the card, e.g. ["PEF","Textiles & Apparels"]
   */
  @Column({ type: 'simple-json', nullable: true })
  tags: string[];

  @Column({ type: 'varchar', nullable: true })
  demoUrl: string;

  /**
   * JSON array of supported master item types for this service domain, e.g. ["ACTIVITY_CATEGORY","EMISSION_FACTOR","UNIT"]
   */
  @Column({ type: 'simple-json', nullable: true })
  allowedMasterTypes: string[];
}
