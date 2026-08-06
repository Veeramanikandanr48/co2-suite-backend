import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CompositeFactorResolver } from './factor-resolver';
import { FactorLookupKey } from './interfaces/factor-provider.interface';

export class MasterItemPublishedEvent {
  constructor(
    public readonly itemType: string,
    public readonly itemId: number | string,
    public readonly code: string,
  ) {}
}

export class EmissionFactorUpdatedEvent {
  constructor(
    public readonly factorId: number,
    public readonly lookupKey?: FactorLookupKey,
  ) {}
}

/**
 * Event-Driven Cache Invalidation Service (ADR-004 / Event Architecture)
 *
 * Listens for system domain events and evicts outdated factor keys from
 * L1 LRU Memory Cache and L2 Redis Cache, preventing stale calculation factors.
 */
@Injectable()
export class FactorCacheInvalidationService {
  private readonly logger = new Logger(FactorCacheInvalidationService.name);

  constructor(private readonly resolver: CompositeFactorResolver) {}

  @OnEvent('master.item.published')
  async handleMasterItemPublished(event: MasterItemPublishedEvent): Promise<void> {
    this.logger.log(`Received MasterItemPublishedEvent: ${event.itemType}:${event.code} (ID: ${event.itemId})`);
    // When master taxonomies or factor sets change, clear resolver caches to guarantee fresh lookups
    await this.resolver.clearAllCaches();
    this.logger.log('Flushed L1 & L2 factor caches following master taxonomy publication');
  }

  @OnEvent('emission.factor.updated')
  async handleEmissionFactorUpdated(event: EmissionFactorUpdatedEvent): Promise<void> {
    this.logger.log(`Received EmissionFactorUpdatedEvent for Factor ID: ${event.factorId}`);
    if (event.lookupKey) {
      await this.resolver.invalidateKey(event.lookupKey);
      this.logger.log(`Evicted factor key ${this.resolver.buildCacheKey(event.lookupKey)} from L1 & L2 caches`);
    } else {
      await this.resolver.clearAllCaches();
      this.logger.log('Flushed factor caches following un-keyed factor update');
    }
  }
}
