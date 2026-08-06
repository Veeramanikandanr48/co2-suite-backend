import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';

export enum AiCapabilityType {
  CATEGORIZATION = 'CATEGORIZATION',
  UNIT_DETECT = 'UNIT_DETECT',
  FACTOR_RECOMMEND = 'FACTOR_RECOMMEND',
  REPORT_SUMMARIZATION = 'REPORT_SUMMARIZATION',
  CHAT_ASSISTANT = 'CHAT_ASSISTANT',
  ANOMALY_DETECTION = 'ANOMALY_DETECTION',
  DUPLICATE_DETECTION = 'DUPLICATE_DETECTION',
  CONFIDENCE_SCORING = 'CONFIDENCE_SCORING',
}

@Entity({ name: 'ai_providers' })
export class AiProvider extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  name: string; // e.g. 'OpenAI GPT-4o', 'Anthropic Claude 3.5', 'Azure OpenAI'

  @Column({ type: 'varchar', nullable: true })
  endpoint: string; // Base API endpoint URL

  @Column({ type: 'varchar', default: 'OPENAI_API_KEY' })
  apiKeyEnvVar: string; // Name of environment variable holding API key

  @Column({ type: 'int', nullable: true })
  tenantId: number; // null = platform-wide, non-null = tenant-specific provider
}

@Entity({ name: 'ai_capabilities' })
@Index(['capabilityType', 'isActive'])
export class AiCapability extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  providerId: number;

  @ManyToOne(() => AiProvider, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'providerId' })
  provider: AiProvider;

  @Column({
    type: 'enum',
    enum: AiCapabilityType,
    default: AiCapabilityType.CATEGORIZATION,
  })
  capabilityType: AiCapabilityType;

  @Column({ type: 'varchar', default: 'gpt-4o' })
  modelName: string; // e.g. 'gpt-4o', 'claude-3-5-sonnet'

  @Column({ type: 'text', nullable: true })
  promptTemplate: string; // Admin-editable system prompt template

  @Column({ type: 'int', default: 1000 })
  maxTokens: number;

  @Column({ type: 'float', default: 0.2 })
  temperature: number;
}

@Entity({ name: 'ai_suggestion_logs' })
@Index(['capabilityType', 'createdAt'])
export class AiSuggestionLog extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  entryId: number;

  @Column({
    type: 'enum',
    enum: AiCapabilityType,
    default: AiCapabilityType.CATEGORIZATION,
  })
  capabilityType: AiCapabilityType;

  @Column({ type: 'text', nullable: true })
  inputText: string;

  @Column({ type: 'text', nullable: true })
  outputJson: string;

  @Column({ type: 'float', default: 0.9 })
  confidence: number;

  @Column({ type: 'int', nullable: true })
  providerId: number;

  @ManyToOne(() => AiProvider, { nullable: true })
  @JoinColumn({ name: 'providerId' })
  provider: AiProvider;
}
