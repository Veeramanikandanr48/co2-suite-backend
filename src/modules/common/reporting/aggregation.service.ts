import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { InventoryEntry } from 'src/entities/inventory-entry.entity';
import { EmissionSummary } from 'src/entities/reporting-analytics.entity';

@Injectable()
export class AggregationService {
  private readonly logger = new Logger(AggregationService.name);

  constructor(
    @InjectRepository(EmissionSummary)
    private readonly summaryRepo: Repository<EmissionSummary>,
    @InjectRepository(InventoryEntry)
    private readonly inventoryRepo: Repository<InventoryEntry>,
  ) {}

  /**
   * Event listener: recomputes EmissionSummary when calculation completes or inventory is committed.
   */
  @OnEvent('calculation.completed')
  async handleCalculationCompleted(payload: { entryId: number; organizationId: number }) {
    this.logger.log(`Event bus received calculation.completed for entry ${payload.entryId}`);
    try {
      await this.recomputeSummaryForOrg(payload.organizationId);
    } catch (err) {
      this.logger.error(`Failed to recompute summary for org ${payload.organizationId}`, err);
    }
  }

  /**
   * Recomputes all EmissionSummary aggregates for an organization.
   */
  async recomputeSummaryForOrg(organizationId: number) {
    const entries = await this.inventoryRepo.find({
      where: { organizationId, isActive: true },
    });

    // Delete existing summaries for org
    await this.summaryRepo.delete({ organizationId });

    const summaryMap = new Map<string, Partial<EmissionSummary>>();

    for (const entry of entries) {
      const year = entry.dateFrom ? parseInt(entry.dateFrom.split('.').pop() || '2025', 10) : 2025;
      const scope = entry.category?.toLowerCase().includes('electricity') ? 'Scope 2' :
                    entry.category?.toLowerCase().includes('travel') || entry.category?.toLowerCase().includes('goods') ? 'Scope 3' : 'Scope 1';
      const category = entry.category || 'General';
      const facilityId = entry.facilityId || undefined;

      const key = `${organizationId}_${year}_${scope}_${category}_${facilityId || 'null'}`;

      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          organizationId,
          reportingYear: year,
          reportingMonth: 0, // full year aggregate
          scope,
          category,
          facilityId,
          totalCO2e: 0,
          co2Emissions: 0,
          ch4Emissions: 0,
          n2oEmissions: 0,
          otherGasesEmissions: 0,
          entryCount: 0,
        });
      }

      const item = summaryMap.get(key)!;
      item.totalCO2e = (item.totalCO2e || 0) + (Number(entry.emission) || 0);
      item.co2Emissions = (item.co2Emissions || 0) + (Number(entry.emission) * 0.98 || 0);
      item.ch4Emissions = (item.ch4Emissions || 0) + (Number(entry.emission) * 0.01 || 0);
      item.n2oEmissions = (item.n2oEmissions || 0) + (Number(entry.emission) * 0.01 || 0);
      item.entryCount = (item.entryCount || 0) + 1;
    }

    const summariesToSave = Array.from(summaryMap.values());
    if (summariesToSave.length > 0) {
      await this.summaryRepo.save(summariesToSave);
      this.logger.log(`Successfully recomputed ${summariesToSave.length} emission summaries for org ${organizationId}`);
    }
  }

  async getSummaries(organizationId: number, year?: number) {
    const where: any = { organizationId };
    if (year) where.reportingYear = year;
    return this.summaryRepo.find({ where, order: { scope: 'ASC', category: 'ASC' } });
  }
}
