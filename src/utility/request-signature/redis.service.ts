import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * RedisService — thin wrapper around ioredis.
 *
 * In development (REDIS_ENABLED=false), all operations are no-ops that
 * return safe defaults so the app works without a Redis server running.
 * In production, REDIS_ENABLED=true + REDIS_URL must be set.
 *
 * The nonce-store and signing-key service depend on this service.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis | null;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.enabled = configService.get<string>('REDIS_ENABLED') !== 'false';

    if (this.enabled) {
      const url = configService.get<string>('REDIS_URL', 'redis://localhost:6379');
      this.client = new Redis(url, { lazyConnect: true });
      this.client.on('error', (err) => this.logger.error(`Redis error: ${err.message}`));
      this.client.connect().catch((err) =>
        this.logger.error(`Redis connect failed: ${err.message}`),
      );
      this.logger.log(`Redis client initialised → ${url}`);
    } else {
      this.client = null;
      this.logger.warn('Redis disabled (REDIS_ENABLED=false). Using in-memory fallback.');
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.quit();
  }

  /** SET key value EX ttlSeconds — returns 'OK' or null on failure / disabled. */
  async set(key: string, value: string, ttlSeconds: number): Promise<string | null> {
    return this.client?.set(key, value, 'EX', ttlSeconds) ?? null;
  }

  /**
   * SETNX key value EX ttlSeconds — atomic set-if-not-exists.
   * Returns true if the key was set (first time), false if it already existed.
   * Crucial for replay protection.
   */
  async setnx(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    if (!this.client) return true; // dev fallback: always allow
    const result = await this.client.set(key, value, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  /** GET key — returns the stored value or null. */
  async get(key: string): Promise<string | null> {
    return this.client?.get(key) ?? null;
  }

  /** DEL key */
  async del(key: string): Promise<void> {
    await this.client?.del(key);
  }
}
