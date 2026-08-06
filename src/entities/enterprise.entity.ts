import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';

// ============================================================================
// 1. MULTI-TENANCY & API KEYS
// ============================================================================

@Entity({ name: 'tenants' })
export class Tenant extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  name: string; // e.g. 'Acme Corporation'

  @Column({ type: 'varchar', nullable: true })
  slug: string; // Used in subdomain routing e.g. 'acme' -> acme.co2suite.com

  @Column({ type: 'varchar', default: 'active' })
  status: string; // 'active' | 'suspended' | 'offboarded'

  @Column({ type: 'varchar', default: 'enterprise' })
  planType: string; // 'starter' | 'professional' | 'enterprise'

  @Column({ type: 'int', default: 2555 })
  dataRetentionDays: number; // Regulatory default: 7 years (2555 days)

  @Column({ type: 'int', default: 100 })
  maxOrganizations: number;
}

@Entity({ name: 'api_keys' })
@Index(['keyHash'], { unique: true })
@Index(['tenantId'])
export class ApiKey extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  name: string; // e.g. 'SAP ERP Integration Key'

  @Column({ type: 'varchar', nullable: true })
  keyPrefix: string; // e.g. 'co2_live_abc123'

  @Column({ type: 'varchar', nullable: true })
  keyHash: string; // bcrypt hash of full API key secret

  @Column({ type: 'int', nullable: true })
  tenantId: number;

  @Column({ type: 'int', nullable: true })
  organizationId: number;

  @Column({ type: 'text', nullable: true })
  permissions: string; // JSON array: ["read:inventory", "write:inventory", "read:reports"]

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date;
}

// ============================================================================
// 2. WEBHOOK ENDPOINTS & DELIVERIES
// ============================================================================

@Entity({ name: 'webhook_endpoints' })
@Index(['organizationId'])
export class WebhookEndpoint extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  name: string; // e.g. 'Oracle ERP Webhook Receiver'

  @Column({ type: 'varchar', nullable: true })
  url: string; // HTTPS target URL

  @Column({ type: 'varchar', nullable: true })
  secret: string; // HMAC secret for payload signature header

  @Column({ type: 'text', nullable: true })
  events: string; // JSON array: ["calculation.completed", "report.generated", "workflow.transitioned"]

  @Column({ type: 'int', nullable: true })
  organizationId: number;

  @Column({ type: 'int', nullable: true })
  tenantId: number;
}

@Entity({ name: 'webhook_deliveries' })
@Index(['webhookEndpointId'])
export class WebhookDelivery extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  webhookEndpointId: number;

  @ManyToOne(() => WebhookEndpoint, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'webhookEndpointId' })
  webhookEndpoint: WebhookEndpoint;

  @Column({ type: 'varchar', nullable: true })
  event: string; // e.g. 'calculation.completed'

  @Column({ type: 'text', nullable: true })
  payloadJson: string;

  @Column({ type: 'int', nullable: true })
  httpStatus: number;

  @Column({ type: 'int', default: 1 })
  attempts: number;

  @Column({ type: 'timestamp', nullable: true })
  nextRetryAt: Date;

  @Column({ type: 'varchar', nullable: true })
  errorMessage: string;
}

// ============================================================================
// 3. PLATFORM AUDIT LOG (Append-Only Compliance Log)
// ============================================================================

@Entity({ name: 'audit_logs' })
@Index(['organizationId', 'createdAt'])
@Index(['entityName', 'entityId'])
export class AuditLog extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  tenantId: number;

  @Column({ type: 'int', nullable: true })
  organizationId: number;

  @Column({ type: 'int', nullable: true })
  userId: number;

  @Column({ type: 'varchar', nullable: true })
  userEmail: string;

  @Column({ type: 'varchar', nullable: true })
  action: string; // 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'EXPORT'

  @Column({ type: 'varchar', nullable: true })
  entityName: string; // e.g. 'InventoryEntry', 'CalculationPolicy'

  @Column({ type: 'int', nullable: true })
  entityId: number;

  @Column({ type: 'text', nullable: true })
  oldValuesJson: string;

  @Column({ type: 'text', nullable: true })
  newValuesJson: string;

  @Column({ type: 'varchar', nullable: true })
  ipAddress: string;

  @Column({ type: 'varchar', nullable: true })
  userAgent: string;
}
