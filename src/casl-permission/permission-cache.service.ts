import { Injectable, Logger } from '@nestjs/common';
import { IUserPermissions } from 'src/utility/base-interface.interface';

export interface CacheMetrics {
  hits: number;
  misses: number;
  invalidations: number;
  /** Percentage of cache hits out of total lookups. */
  hitRate: number;
}

/**
 * PermissionCacheService — abstracted permission caching layer.
 *
 * Development: in-memory Map (default, zero dependencies).
 * Production:  swap the Map implementation for a Redis client behind this
 *              same interface — callers never change.
 *
 * Cache key format: `perms:{roleId}:v{permissionsVersion}`
 * This ensures that bumping permissionsVersion in the JWT
 * automatically bypasses stale cache entries.
 */
@Injectable()
export class PermissionCacheService {
  private readonly logger = new Logger(PermissionCacheService.name);
  private readonly cache = new Map<string, IUserPermissions[]>();

  private metrics: { hits: number; misses: number; invalidations: number } = {
    hits: 0,
    misses: 0,
    invalidations: 0,
  };

  private buildKey(roleId: number, version: number): string {
    return `perms:${roleId}:v${version}`;
  }

  async get(
    roleId: number,
    version: number,
  ): Promise<IUserPermissions[] | null> {
    const key = this.buildKey(roleId, version);
    const cached = this.cache.get(key);
    if (cached) {
      this.metrics.hits++;
      this.logger.debug(`Cache HIT  for ${key} (hits=${this.metrics.hits})`);
      return cached;
    }
    this.metrics.misses++;
    this.logger.debug(`Cache MISS for ${key} (misses=${this.metrics.misses})`);
    return null;
  }

  async set(
    roleId: number,
    version: number,
    permissions: IUserPermissions[],
  ): Promise<void> {
    const key = this.buildKey(roleId, version);
    this.cache.set(key, permissions);
    this.logger.debug(`Cache SET  for ${key} (${permissions.length} entries)`);
  }

  /**
   * Invalidate all cached permissions for a role (all versions).
   * Call this whenever a role's permissions are updated.
   */
  async invalidate(roleId: number): Promise<void> {
    const prefix = `perms:${roleId}:`;
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }
    this.metrics.invalidations++;
    this.logger.debug(
      `Cache INVALIDATED ${count} entries for roleId=${roleId} (total invalidations=${this.metrics.invalidations})`,
    );
  }

  /**
   * Returns hit/miss/invalidation counts plus a derived hitRate percentage.
   * Exposed via GET /permissions/cache/metrics for operational visibility.
   */
  getMetrics(): CacheMetrics {
    const total = this.metrics.hits + this.metrics.misses;
    return {
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      invalidations: this.metrics.invalidations,
      hitRate: total === 0 ? 0 : parseFloat(((this.metrics.hits / total) * 100).toFixed(2)),
    };
  }
}
