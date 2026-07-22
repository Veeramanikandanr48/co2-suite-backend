import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { RedisService } from './redis.service';

/**
 * SigningKeyService — issues and manages per-session HMAC signing keys.
 *
 * After a successful login the backend generates a cryptographically
 * random 32-byte signing key and stores it in Redis keyed by userId.
 * The same key is returned to the frontend in the login response body
 * and stored only in JS memory (never in localStorage/cookies).
 *
 * Every subsequent request is signed with this key via HMAC-SHA256.
 * The middleware retrieves the key here and verifies the signature.
 *
 * Key lifetime: 24 h (matching refresh-token expiry).
 * On logout the key is revoked immediately.
 */
@Injectable()
export class SigningKeyService {
  private readonly logger = new Logger(SigningKeyService.name);
  private readonly KEY_TTL_SECONDS = 24 * 60 * 60; // 24 hours

  constructor(private readonly redis: RedisService) {}

  private buildKey(userId: number): string {
    return `sig:${userId}`;
  }

  /** Generates a fresh 32-byte hex signing key. */
  generate(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /** Stores the signing key for a user in Redis. */
  async store(userId: number, signingKey: string): Promise<void> {
    await this.redis.set(this.buildKey(userId), signingKey, this.KEY_TTL_SECONDS);
    this.logger.debug(`Signing key stored for userId=${userId}`);
  }

  /** Retrieves the signing key for a user (null if expired or never set). */
  async get(userId: number): Promise<string | null> {
    return this.redis.get(this.buildKey(userId));
  }

  /** Revokes the signing key on logout (immediately invalidates all signed requests). */
  async revoke(userId: number): Promise<void> {
    await this.redis.del(this.buildKey(userId));
    this.logger.debug(`Signing key revoked for userId=${userId}`);
  }
}
