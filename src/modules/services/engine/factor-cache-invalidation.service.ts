import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CompositeFactorResolver } from './factor-resolver';
import { FactorLookupKey } from './interfaces/factor-provider.interface';

/**
 * Versioned Domain Event (ADR: Event Versioning)
 * All domain event payloads include `eventVersion` for zero-downtime schema evolution.
 */
export class MasterItemPublishedV1Event {
  public readonly eventVersion = 'v1';
  constructor(
    public readonly itemType: string,
    public readonly itemId: number | string,
    public readonly code: string,
    public readonly timestamp: string = new Date().toISOString(),
  ) {}
}

export class EmissionFactorUpdatedV1Event {
  public readonly eventVersion = 'v1';
  constructor(
    public readonly factorId: number,
    public readonly lookupKey?: FactorLookupKey,
    public readonly timestamp: string = new Date().toISOString(),
  ) {}
}

export class CalculationPolicyChangedV1Event {
  public readonly eventVersion = 'v1';
  constructor(
    public readonly organizationId: number,
    public readonly policyId: number,
    public readonly timestamp: string = new Date().toISOString(),
  ) {}
}

// Alias exports for backward compatibility
export const MasterItemPublishedEvent = MasterItemPublishedV1Event;
export const EmissionFactorUpdatedEvent = EmissionFactorUpdatedV1Event;

/**
 * Event-Driven Cache Invalidation Service (ADR-004 / Versioned Event Architecture)
 *
 * Listens for versioned system domain events (`v1`) and evicts outdated factor keys
 * from L1 LRU Memory Cache and L2 Redis Cache.
 */
@Injectable()
export class FactorCacheInvalidationService {
  private readonly logger = new Logger(FactorCacheInvalidationService.name);

  constructor(private readonly resolver: CompositeFactorResolver) {}

  @OnEvent('master.item.published.v1')
  @OnEvent('master.item.published')
  async handleMasterItemPublished(event: MasterItemPublishedV1Event): Promise<void> {
    this.logger.log(`Received MasterItemPublishedV1Event (${event.eventVersion}): ${event.itemType}:${event.code} (ID: ${event.itemId})`);
    await this.resolver.clearAllCaches();
    this.logger.log('Flushed L1 & L2 factor caches following master taxonomy publication');
  }

  @OnEvent('emission.factor.updated.v1')
  @OnEvent('emission.factor.updated')
  async handleEmissionFactorUpdated(event: EmissionFactorUpdatedV1Event): Promise<void> {
    this.logger.log(`Received EmissionFactorUpdatedV1Event (${event.eventVersion}) for Factor ID: ${event.factorId}`);
    if (event.lookupKey) {
      await this.resolver.invalidateKey(event.lookupKey);
      this.logger.log(`Evicted factor key ${this.resolver.buildCacheKey(event.lookupKey)} from L1 & L2 caches`);
    } else {
      await this.resolver.clearAllCaches();
      this.logger.log('Flushed factor caches following un-keyed factor update');
    }
  }

  @OnEvent('calculation.policy.changed.v1')
  async handleCalculationPolicyChanged(event: CalculationPolicyChangedV1Event): Promise<void> {
    this.logger.log(`Received CalculationPolicyChangedV1Event (${event.eventVersion}) for Org ID: ${event.organizationId}`);
    await this.resolver.clearAllCaches();
  }
}
