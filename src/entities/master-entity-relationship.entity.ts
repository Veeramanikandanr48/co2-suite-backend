import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import type { MasterEntity } from './master-entity.entity';

@Entity({ name: 'master_entity_relationships' })
@Index(['relationshipType', 'sourceEntityId', 'targetEntityId'], { unique: true })
export class MasterEntityRelationship extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'varchar', length: 60 })
  relationshipType: string;

  @Index()
  @Column({ type: 'int' })
  sourceEntityId: number;

  @ManyToOne('MasterEntity', { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sourceEntityId' })
  sourceEntity: MasterEntity;

  @Index()
  @Column({ type: 'int' })
  targetEntityId: number;

  @ManyToOne('MasterEntity', { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'targetEntityId' })
  targetEntity: MasterEntity;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;
}
