import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as crypto from 'crypto';
import Redis from 'ioredis';

@Injectable()
export class SessionSigningKeyService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SessionSigningKeyService.name);
  private redisClient: Redis | null = null;
  private readonly memorySigningKeys = new Map<string, { key: string; expiresAt: number }>();
  private readonly memoryNonces = new Map<string, number>();
  private memoryCleanupInterval: NodeJS.Timeout | null = null;

  async onModuleInit() {
    const redisHost = process.env.REDIS_HOST;
    const redisPort = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379;
    const redisPassword = process.env.REDIS_PASSWORD || undefined;

    if (redisHost) {
      try {
        this.redisClient = new Redis({
          host: redisHost,
          port: redisPort,
          password: redisPassword,
          lazyConnect: true,
          maxRetriesPerRequest: 1,
        });

        this.redisClient.on('error', (err) => {
          this.logger.warn(`Redis connection warning: ${err.message}. Falling back to memory store.`);
        });

        await this.redisClient.connect().catch((err) => {
          this.logger.warn(`Could not connect to Redis server (${err.message}). Using in-process memory store.`);
          this.redisClient = null;
        });
      } catch (err) {
        this.logger.warn(`Redis initialization failed: ${(err as Error).message}. Using in-process memory store.`);
        this.redisClient = null;
      }
    } else {
      this.logger.log('No REDIS_HOST configured. Using in-process memory store for session keys and nonces.');
    }

    // Set up periodic cleanup for fallback memory store
    this.memoryCleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [sId, item] of this.memorySigningKeys.entries()) {
        if (now > item.expiresAt) {
          this.memorySigningKeys.delete(sId);
        }
      }
      for (const [nonce, expiresAt] of this.memoryNonces.entries()) {
        if (now > expiresAt) {
          this.memoryNonces.delete(nonce);
        }
      }
    }, 30000);
  }

  onModuleDestroy() {
    if (this.memoryCleanupInterval) {
      clearInterval(this.memoryCleanupInterval);
    }
    if (this.redisClient) {
      this.redisClient.disconnect();
    }
  }

  /**
   * Generates a random 32-byte session signing key and persists it linked to sessionId.
   * @param sessionId Session ID or UserSession database ID
   * @param ttlSeconds Expiration matching refresh token lifetime (default 7 days)
   */
  async createSigningKey(sessionId: string | number, ttlSeconds = 7 * 24 * 3600): Promise<string> {
    const key = crypto.randomBytes(32).toString('hex');
    const redisKey = `session:${sessionId}:signingKey`;

    if (this.redisClient && this.redisClient.status === 'ready') {
      try {
        await this.redisClient.set(redisKey, key, 'EX', ttlSeconds);
        return key;
      } catch (err) {
        this.logger.warn(`Failed to store signing key in Redis: ${(err as Error).message}`);
      }
    }

    // In-memory fallback
    this.memorySigningKeys.set(String(sessionId), {
      key,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return key;
  }

  /**
   * Retrieves the signing key for a session.
   */
  async getSigningKey(sessionId: string | number): Promise<string | null> {
    const redisKey = `session:${sessionId}:signingKey`;

    if (this.redisClient && this.redisClient.status === 'ready') {
      try {
        const key = await this.redisClient.get(redisKey);
        if (key) return key;
      } catch (err) {
        this.logger.warn(`Failed to get signing key from Redis: ${(err as Error).message}`);
      }
    }

    const item = this.memorySigningKeys.get(String(sessionId));
    if (item) {
      if (Date.now() > item.expiresAt) {
        this.memorySigningKeys.delete(String(sessionId));
        return null;
      }
      return item.key;
    }

    return null;
  }

  /**
   * Revokes the signing key for a session.
   */
  async revokeSigningKey(sessionId: string | number): Promise<void> {
    const redisKey = `session:${sessionId}:signingKey`;

    if (this.redisClient && this.redisClient.status === 'ready') {
      try {
        await this.redisClient.del(redisKey);
      } catch (err) {
        this.logger.warn(`Failed to delete signing key from Redis: ${(err as Error).message}`);
      }
    }

    this.memorySigningKeys.delete(String(sessionId));
  }

  /**
   * Atomically checks and records a nonce to prevent replay attacks using SETNX.
   * @returns true if nonce was NEW (valid), false if nonce was ALREADY USED (replay attempt).
   */
  async checkAndMarkNonce(nonce: string, ttlSeconds = 60): Promise<boolean> {
    const redisKey = `nonce:${nonce}`;

    if (this.redisClient && this.redisClient.status === 'ready') {
      try {
        const result = await this.redisClient.set(redisKey, '1', 'EX', ttlSeconds, 'NX');
        return result === 'OK';
      } catch (err) {
        this.logger.warn(`Failed to check nonce in Redis: ${(err as Error).message}`);
      }
    }

    // In-memory SETNX fallback
    const now = Date.now();
    const existingExpiry = this.memoryNonces.get(nonce);
    if (existingExpiry && now <= existingExpiry) {
      return false; // Replay detected
    }

    this.memoryNonces.set(nonce, now + ttlSeconds * 1000);
    return true;
  }
}
