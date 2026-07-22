import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserDetails } from './user.entity';

/**
 * user_sessions — tracks every refresh token issued.
 *
 * Supports:
 *  - Session listing per user (admin view of active devices)
 *  - Selective revocation (logout from specific device)
 *  - Token rotation (isRevoked on use, new session created)
 *  - Security audit (createdByIp, lastUsedAt)
 */
@Entity({ name: 'user_sessions' })
export class UserSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => UserDetails)
  @JoinColumn({ name: 'userId' })
  user: UserDetails;

  @Column({ type: 'text' })
  refreshToken: string;

  @Column()
  expiresAt: Date;

  // ─── Device / Origin Metadata ────────────────────────────────────────────────

  /** IP address at the time of login (creation) */
  @Column({ nullable: true })
  createdByIp: string;

  /** IP address of the most recent token use */
  @Column({ nullable: true })
  lastUsedIp: string;

  /** Parsed user agent string — e.g. 'Chrome 125 on Windows' */
  @Column({ nullable: true, type: 'text' })
  userAgent: string;

  /** Human-readable device label — populated from user agent parsing */
  @Column({ nullable: true })
  deviceName: string;

  // ─── Activity Tracking ───────────────────────────────────────────────────────

  /** Timestamp of the most recent access using this session */
  @Column({ nullable: true })
  lastUsedAt: Date;

  // ─── Revocation ──────────────────────────────────────────────────────────────

  /** True when the session has been explicitly revoked or rotated */
  @Column({ default: false })
  isRevoked: boolean;

  /**
   * Populated when isRevoked becomes true.
   * Distinguishes logout (user action) from rotation (token refresh) from
   * admin revocation.
   */
  @Column({ nullable: true })
  revokedAt: Date;

  /** Reason for revocation — 'logout' | 'rotation' | 'admin' | 'expired' */
  @Column({ nullable: true })
  revokedReason: string;

  @CreateDateColumn()
  createdOn: Date;

  @UpdateDateColumn()
  updatedOn: Date;
}
