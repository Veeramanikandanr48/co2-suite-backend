import { Injectable, Logger } from '@nestjs/common';
import { FactorLookupKey, IFactorProvider, ResolvedFactor } from './interfaces/factor-provider.interface';

export interface SimpleRedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, duration?: number): Promise<'OK' | null>;
  del(key: string | string[]): Promise<number>;
  mget(...keys: string[]): Promise<(string | null)[]>;
  keys(pattern: string): Promise<string[]>;
}

/**
 * L2 Redis Factor Provider (ADR-004)
 *
 * Provides distributed L2 caching for emission factor resolution.
 * Supports single factor lookups, batch `MGET` queries, and TTL expiration.
 * Features graceful degradation: If Redis is unavailable, returns null
 * without throwing exceptions, allowing the resolver to fall back to L3 Database.
 */
@Injectable()
export class RedisFactorProvider implements IFactorProvider {
  private readonly logger = new Logger(RedisFactorProvider.name);
  private client: SimpleRedisClient | null = null;
  private isConnected = false;
  private readonly defaultTtlSeconds = 3600; // 1-hour TTL

  constructor(redisClient?: SimpleRedisClient) {
    if (redisClient) {
      this.client = redisClient;
      this.isConnected = true;
    }
  }

  /**
   * Attaches or updates the active Redis client.
   */
  setClient(redisClient: SimpleRedisClient | null): void {
    this.client = redisClient;
    this.isConnected = !!redisClient;
  }

  /**
   * Builds the Redis string key for factor lookup.
   */
  public buildKey(key: FactorLookupKey): string {
    return `ef:${key.organizationId ?? 0}:${key.scopeId}:${key.activityCategoryId}:${key.fuelGasTypeId}:${key.measurementUnitId}:${key.countryId ?? 0}:${key.regionId ?? 0}:${key.factorSourceId}:${key.factorVersionId}:${key.effectiveDate || '2026-01-01'}`;
  }

  /**
   * L2 Single Factor Resolution
   */
  async resolveFactor(key: FactorLookupKey): Promise<ResolvedFactor | null> {
    if (!this.client || !this.isConnected) return null;

    try {
      const redisKey = this.buildKey(key);
      const data = await this.client.get(redisKey);
      if (!data) return null;
      return JSON.parse(data) as ResolvedFactor;
    } catch (err) {
      this.logger.warn(`L2 Redis read error (falling back to DB): ${(err as Error).message}`);
      return null;
    }
  }

  /**
   * L2 Vectorized Batch Resolution using Redis MGET
   */
  async resolveFactorsBatch(keys: FactorLookupKey[]): Promise<Map<string, ResolvedFactor>> {
    const resultMap = new Map<string, ResolvedFactor>();
    if (!this.client || !this.isConnected || keys.length === 0) return resultMap;

    try {
      const redisKeys = keys.map((k) => this.buildKey(k));
      const rawResults = await this.client.mget(...redisKeys);

      rawResults.forEach((val, idx) => {
        if (val) {
          try {
            const factor = JSON.parse(val) as ResolvedFactor;
            resultMap.set(redisKeys[idx], factor);
          } catch {
            // Ignore parse errors on corrupt cache entries
          }
        }
      });
    } catch (err) {
      this.logger.warn(`L2 Redis MGET error: ${(err as Error).message}`);
    }

    return resultMap;
  }

  /**
   * Writes a resolved factor entry to L2 Redis cache.
   */
  async setFactor(key: FactorLookupKey, factor: ResolvedFactor, ttlSeconds = this.defaultTtlSeconds): Promise<void> {
    if (!this.client || !this.isConnected) return;

    try {
      const redisKey = this.buildKey(key);
      await this.client.set(redisKey, JSON.stringify(factor), 'EX', ttlSeconds);
    } catch (err) {
      this.logger.warn(`L2 Redis set error: ${(err as Error).message}`);
    }
  }

  /**
   * Writes batch resolved factors to L2 Redis cache.
   */
  async setFactorsBatch(entries: Array<{ key: FactorLookupKey; factor: ResolvedFactor }>, ttlSeconds = this.defaultTtlSeconds): Promise<void> {
    if (!this.client || !this.isConnected || entries.length === 0) return;

    try {
      await Promise.all(
        entries.map(({ key, factor }) => this.setFactor(key, factor, ttlSeconds))
      );
    } catch (err) {
      this.logger.warn(`L2 Redis batch set error: ${(err as Error).message}`);
    }
  }

  /**
   * Evicts a factor key from L2 Redis.
   */
  async evictFactor(key: FactorLookupKey): Promise<void> {
    if (!this.client || !this.isConnected) return;

    try {
      const redisKey = this.buildKey(key);
      await this.client.del(redisKey);
    } catch (err) {
      this.logger.warn(`L2 Redis delete error: ${(err as Error).message}`);
    }
  }

  /**
   * Evicts all factor keys matching `ef:*` from L2 Redis.
   */
  async evictAllFactors(): Promise<number> {
    if (!this.client || !this.isConnected) return 0;

    try {
      const keys = await this.client.keys('ef:*');
      if (keys.length > 0) {
        return await this.client.del(keys);
      }
    } catch (err) {
      this.logger.warn(`L2 Redis evict all error: ${(err as Error).message}`);
    }
    return 0;
  }
}
