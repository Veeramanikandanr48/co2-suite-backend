import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'services' })
export class Service {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  category: string;

  /**
   * JSON array of badge labels shown on the card, e.g. ["PEF","Textiles & Apparels"]
   */
  @Column({ type: 'simple-json', nullable: true })
  tags: string[];

  @Column({ nullable: true })
  demoUrl: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdOn: Date;

  @UpdateDateColumn()
  updatedOn: Date;
}
