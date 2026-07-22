import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * NonceStoreService — cluster-safe replay protection via Redis.
 *
 * Every signed request carries a unique X-Request-Nonce.
 * The middleware calls exists() first; if false, it calls store().
 * The nonce is kept for 60 seconds (matching the maximum allowed
 * request timestamp drift of 30 seconds with buffer).
 *
 * With Redis SETNX the check-and-set is atomic — no race conditions
 * even under load or across multiple NestJS instances.
 */
@Injectable()
export class NonceStoreService {
  private readonly TTL_SECONDS = 60;

  constructor(private readonly redis: RedisService) {}

  private buildKey(nonce: string): string {
    return `nonce:${nonce}`;
  }

  /**
   * Attempts to store the nonce atomically (SETNX).
   * Returns true  → nonce is fresh (first use).
   * Returns false → nonce was already seen (replay attack).
   */
  async claimNonce(nonce: string): Promise<boolean> {
    return this.redis.setnx(this.buildKey(nonce), '1', this.TTL_SECONDS);
  }
}
