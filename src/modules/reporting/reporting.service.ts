import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CalculationResult } from 'src/entities/calculation-result.entity';
import { CalculationRun } from 'src/entities/calculation-run.entity';
import { InventoryEntry } from 'src/entities/inventory-entry.entity';
import { OrganizationBoundary } from 'src/entities/organization-boundary.entity';
import { SourceInclusion } from 'src/entities/source-inclusion.entity';
import { Scope2ReportingBasis } from 'src/enums/ghg.enum';
import { MasterRole } from 'src/enums/casl.enum';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';

interface ApprovedResultRow {
  result: CalculationResult;
  entry?: InventoryEntry;
}

@Injectable()
export class ReportingService {
  constructor(
    @InjectRepository(CalculationResult)
    private readonly resultRepo: Repository<CalculationResult>,
    @InjectRepository(CalculationRun)
    private readonly runRepo: Repository<CalculationRun>,
    @InjectRepository(InventoryEntry)
    private readonly entryRepo: Repository<InventoryEntry>,
    @InjectRepository(OrganizationBoundary)
    private readonly boundaryRepo: Repository<OrganizationBoundary>,
    @InjectRepository(SourceInclusion)
    private readonly inclusionRepo: Repository<SourceInclusion>,
  ) {}

  private resolveTargetOrgId(
    user: IDecodeUserDetails,
    requestedOrgId?: number,
  ): number | undefined {
    if (user?.roleId === MasterRole.SUPER_ADMIN) {
      return requestedOrgId || user?.organizationId || 1;
    }
    return user?.organizationId || requestedOrgId || 1;
  }

  private requireOrgId(user: IDecodeUserDetails, requestedOrgId?: number): number {
    const organizationId = this.resolveTargetOrgId(user, requestedOrgId);
    if (!organizationId) {
      throw new BadRequestException('Organization is required');
    }
    return organizationId;
  }

  /**
   * Approved latest results (doc 25 §Reconciliation): only approved/eligible
   * records count towards the official total.
   */
  private async approvedResultRows(params: {
    organizationId: number;
    reportingYear?: number;
    facility?: string;
    scopeNumber?: number;
    category?: string;
  }): Promise<ApprovedResultRow[]> {
    const qb = this.resultRepo
      .createQueryBuilder('result')
      .leftJoinAndSelect('result.inventoryEntry', 'entry')
      .leftJoinAndSelect('result.factor', 'factor')
      .leftJoinAndSelect('result.gwpSet', 'gwpSet')
      .leftJoinAndSelect('result.calculationRun', 'run')
      .where('result.isLatest = :isLatest', { isLatest: true })
      .andWhere('entry.organizationId = :orgId', {
        orgId: params.organizationId,
      })
      .andWhere('LOWER(entry.approvalStatus) = :approved', {
        approved: 'approved',
      })
      .andWhere('LOWER(entry.inclusionStatus) = :included', {
        included: 'included',
      });

    if (params.reportingYear) {
      qb.andWhere(
        '(entry.dateFrom LIKE :y1 OR entry.dateTo LIKE :y2)',
        {
          y1: `${params.reportingYear}%`,
          y2: `${params.reportingYear}%`,
        },
      );
    }
    if (params.facility) {
      qb.andWhere('entry.facility = :facility', {
        facility: params.facility,
      });
    }
    if (params.scopeNumber) {
      qb.andWhere('entry.scopeNumber = :scopeNumber', {
        scopeNumber: params.scopeNumber,
      });
    }
    if (params.category) {
      qb.andWhere('entry.category = :category', { category: params.category });
    }

    const rows = await qb.getMany();
    return rows.map((result) => ({
      result,
      entry: result.inventoryEntry ?? undefined,
    }));
  }

  /**
   * Reconciliation (doc 25 §12.1): Scope 1 + selected Scope 2 basis + Scope 3
   * = Organization Total. Location- and market-based Scope 2 are alternative
   * views, never additive.
   */
  async reconciliation(
    user: IDecodeUserDetails,
    params: {
      reportingYear?: number;
      organizationId?: number;
      facility?: string;
    },
  ) {
    const organizationId = this.requireOrgId(user, params.organizationId);

    const rows = await this.approvedResultRows({
      organizationId,
      reportingYear: params.reportingYear,
      facility: params.facility,
    });

    const scopeTotals: Record<string, number> = {};
    const scope2ByBasis: Record<string, number> = {};
    const categoryTotals: Record<
      string,
      { scopeNumber: number | null; total: number; entries: number }
    > = {};
    const facilityTotals: Record<string, number> = {};
    let totalAll = 0;

    for (const row of rows) {
      const entry = row.entry;
      if (!entry) continue;
      const scopeKey =
        entry.scopeNumber === 1
          ? 'S1'
          : entry.scopeNumber === 2
            ? 'S2'
            : entry.scopeNumber === 3
              ? 'S3'
              : 'UNASSIGNED';
      const t = row.result.totalEmission || 0;

      scopeTotals[scopeKey] = (scopeTotals[scopeKey] || 0) + t;
      if (scopeKey === 'S2' && entry.reportingBasis) {
        const basisKey = entry.reportingBasis.toUpperCase();
        scope2ByBasis[basisKey] = (scope2ByBasis[basisKey] || 0) + t;
      }
      const catKey = entry.category || 'Uncategorized';
      if (!categoryTotals[catKey]) {
        categoryTotals[catKey] = {
          scopeNumber: entry.scopeNumber,
          total: 0,
          entries: 0,
        };
      }
      categoryTotals[catKey].total += t;
      categoryTotals[catKey].entries += 1;
      if (entry.facility) {
        facilityTotals[entry.facility] =
          (facilityTotals[entry.facility] || 0) + t;
      }
      totalAll += t;
    }

    // Selected Scope 2 reporting basis from the org boundary for the year
    const boundary = params.reportingYear
      ? await this.boundaryRepo.findOne({
          where: {
            organizationId,
            reportingYear: params.reportingYear,
            isActive: true,
          },
        })
      : await this.boundaryRepo.findOne({
          where: { organizationId, isActive: true },
          order: { reportingYear: 'DESC' },
        });

    const selectedBasis =
      boundary?.scope2ReportingBasis || Scope2ReportingBasis.LOCATION_BASED;
    const scope2Selected =
      selectedBasis === Scope2ReportingBasis.DUAL
        ? (scope2ByBasis[Scope2ReportingBasis.LOCATION_BASED] || 0) +
          (scope2ByBasis[Scope2ReportingBasis.MARKET_BASED] || 0)
        : scope2ByBasis[selectedBasis] || 0;

    const organizationTotal =
      (scopeTotals['S1'] || 0) + scope2Selected + (scopeTotals['S3'] || 0);

    return {
      organizationId,
      reportingYear: params.reportingYear ?? null,
      facilityFilter: params.facility ?? null,
      boundary: boundary
        ? {
            consolidationApproach: boundary.consolidationApproach,
            scope2ReportingBasis: boundary.scope2ReportingBasis,
            methodologyRegistryRef: boundary.methodologyRegistryRef,
          }
        : null,
      scopes: {
        scope1: scopeTotals['S1'] || 0,
        scope2: scope2Selected,
        scope2LocationBased:
          scope2ByBasis[Scope2ReportingBasis.LOCATION_BASED] || 0,
        scope2MarketBased:
          scope2ByBasis[Scope2ReportingBasis.MARKET_BASED] || 0,
        scope2ReportingBasis: selectedBasis,
        scope3: scopeTotals['S3'] || 0,
        unassigned: scopeTotals['UNASSIGNED'] || 0,
      },
      organizationTotal,
      categories: Object.entries(categoryTotals)
        .map(([category, v]) => ({ category, ...v }))
        .sort((a, b) => b.total - a.total),
      facilities: Object.entries(facilityTotals)
        .map(([facility, total]) => ({ facility, total }))
        .sort((a, b) => b.total - a.total),
    };
  }

  /**
   * Drill-down (doc 25 §12.3): total → scope → category/source → activity
   * record → factor → GWP → calculation version.
   */
  async breakdown(
    user: IDecodeUserDetails,
    params: {
      reportingYear?: number;
      organizationId?: number;
      scopeNumber?: number;
      category?: string;
      facility?: string;
    },
  ) {
    const organizationId = this.requireOrgId(user, params.organizationId);

    const rows = await this.approvedResultRows({
      organizationId,
      reportingYear: params.reportingYear,
      scopeNumber: params.scopeNumber,
      category: params.category,
      facility: params.facility,
    });

    const entries = rows
      .filter((r) => r.entry)
      .map((r) => {
        const result = r.result;
        const entry = r.entry as InventoryEntry;
        return {
          entryId: entry.id,
          name: entry.name,
          category: entry.category,
          scopeNumber: entry.scopeNumber,
          facility: entry.facility,
          unit: entry.unit,
          amount: entry.amount,
          totalEmission: result.totalEmission,
          biogenicCo2: result.biogenicCo2,
          factor: result.factor
            ? {
                id: result.factor.id,
                fuelId: result.factor.fuelId,
                factorVersionId: result.factor.factorVersionId,
                factorValue: result.factor.factorValue,
                unitBasis:
                  result.factor.unitBasis?.symbol ?? result.factor.outputUnit,
                geography: result.factor.geography,
                source: result.factor.sourceReference,
              }
            : null,
          gwpSet: result.gwpSet
            ? { id: result.gwpSet.id, name: result.gwpSet.name }
            : null,
          calculation: {
            runId: result.calculationRunId,
            resultId: result.id,
            versionNumber: result.versionNumber,
            resultStatus: result.resultStatus,
            engineVersion: result.calculationRun?.engineVersion ?? null,
          },
          trace: result.calculationTrace,
        };
      });

    const total = entries.reduce((sum, e) => sum + (e.totalEmission || 0), 0);
    return {
      organizationId,
      filters: {
        reportingYear: params.reportingYear ?? null,
        scopeNumber: params.scopeNumber ?? null,
        category: params.category ?? null,
        facility: params.facility ?? null,
      },
      total,
      entries,
    };
  }

  /**
   * Methodology disclosure (doc 25 §12.2): standard/version, boundary,
   * factor source/version, GWP set, engine version, fallback %, exclusions,
   * data-quality mix and pending approvals.
   */
  async methodologyDisclosure(
    user: IDecodeUserDetails,
    params: { reportingYear?: number; organizationId?: number },
  ) {
    const organizationId = this.requireOrgId(user, params.organizationId);
    const year = params.reportingYear;

    const boundary = year
      ? await this.boundaryRepo.findOne({
          where: { organizationId, reportingYear: year, isActive: true },
        })
      : await this.boundaryRepo.findOne({
          where: { organizationId, isActive: true },
          order: { reportingYear: 'DESC' },
        });

    const [latestRun, gwpRow, inclusions] = await Promise.all([
      this.runRepo.findOne({
        where: { organizationId, status: 'COMPLETED' },
        order: { createdAt: 'DESC' },
      }),
      this.resultRepo
        .createQueryBuilder('result')
        .innerJoin('result.gwpSet', 'gwpSet')
        .select('gwpSet.name', 'name')
        .addSelect('gwpSet.assessment', 'assessment')
        .addSelect('gwpSet.version', 'version')
        .addSelect('COUNT(result.id)', 'count')
        .innerJoin(
          InventoryEntry,
          'entry',
          'entry.id = result.inventoryEntryId AND entry.organizationId = :orgId',
          { orgId: organizationId },
        )
        .where('result.isLatest = :isLatest', { isLatest: true })
        .groupBy('gwpSet.id')
        .addGroupBy('gwpSet.name')
        .addGroupBy('gwpSet.assessment')
        .addGroupBy('gwpSet.version')
        .orderBy('"count"', 'DESC')
        .limit(1)
        .getRawOne<{
          name: string;
          assessment: string;
          version: string;
        }>(),
      this.inclusionRepo.find({
        where: {
          organizationId,
          isActive: true,
          ...(year ? { reportingYear: year } : {}),
        },
      }),
    ]);

    const allRows = await this.approvedResultRows({ organizationId });
    const fallbackCount = allRows.filter((r) =>
      (r.result.calculationTrace ?? []).some((t) =>
        t.toUpperCase().includes('FALLBACK'),
      ),
    ).length;

    const [approvedCount, pendingApproval, dataQualityMix] = await Promise.all([
      this.entryRepo.count({
        where: {
          organizationId,
          approvalStatus: 'approved',
          ...(year ? { dateFrom: `${year}%` } : {}),
        },
      }),
      this.entryRepo
        .createQueryBuilder('entry')
        .where('entry.organizationId = :orgId', { orgId: organizationId })
        .andWhere(
          'entry.approvalStatus IS NULL OR LOWER(entry.approvalStatus) IN (:...pending)',
          { pending: ['pending', 'submitted', 'draft', ''] },
        )
        .andWhere('entry.isActive = :isActive', { isActive: true })
        .getCount(),
      this.entryRepo
        .createQueryBuilder('entry')
        .select('entry.dataQuality', 'quality')
        .addSelect('COUNT(entry.id)', 'count')
        .where('entry.organizationId = :orgId', { orgId: organizationId })
        .andWhere('entry.dataQuality IS NOT NULL')
        .andWhere('entry.isActive = :isActive', { isActive: true })
        .groupBy('entry.dataQuality')
        .getRawMany<{ quality: string; count: string }>(),
    ]);

    const exclusionCount = inclusions.filter(
      (i) => i.inclusionStatus === 'EXCLUDED',
    ).length;

    return {
      organizationId,
      reportingYear: year ?? null,
      methodology: boundary?.methodologyRegistryRef ?? null,
      boundary: boundary
        ? {
            consolidationApproach: boundary.consolidationApproach,
            scope2ReportingBasis: boundary.scope2ReportingBasis,
          }
        : null,
      engineVersion: latestRun?.engineVersion ?? null,
      gwpSet: gwpRow
        ? {
            name: gwpRow.name,
            assessment: gwpRow.assessment,
            version: gwpRow.version,
          }
        : null,
      dataQuality: {
        fallbackEntries: fallbackCount,
        approvedEntries: approvedCount,
        pendingApproval,
        qualityMix: dataQualityMix,
      },
      exclusions: {
        excludedSources: exclusionCount,
        sources: inclusions.map((i) => ({
          sourceKey: i.sourceKey,
          category: i.category,
          inclusionStatus: i.inclusionStatus,
          exclusionReason: i.exclusionReason,
        })),
      },
    };
  }

  /**
   * CSV export of the approved drill-down rows.
   */
  async exportCsv(
    user: IDecodeUserDetails,
    params: {
      reportingYear?: number;
      organizationId?: number;
      scopeNumber?: number;
      category?: string;
      facility?: string;
    },
  ): Promise<{ filename: string; csv: string }> {
    const breakdown = await this.breakdown(user, params);

    const header = [
      'entryId',
      'name',
      'category',
      'scopeNumber',
      'facility',
      'unit',
      'amount',
      'totalEmission_tCO2e',
      'biogenicCo2_kgCO2e',
      'factorValue',
      'factorUnitBasis',
      'factorSource',
      'gwpSet',
      'engineVersion',
      'resultStatus',
      'versionNumber',
      'runId',
      'resultId',
    ];

    const escape = (v: unknown): string => {
      const s = v === null || v === undefined ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const lines = [header.join(',')];
    for (const e of breakdown.entries) {
      lines.push(
        [
          e.entryId,
          e.name,
          e.category,
          e.scopeNumber,
          e.facility,
          e.unit,
          e.amount,
          e.totalEmission,
          e.biogenicCo2,
          e.factor?.factorValue,
          e.factor?.unitBasis,
          e.factor?.source,
          e.gwpSet?.name,
          e.calculation?.engineVersion,
          e.calculation?.resultStatus,
          e.calculation?.versionNumber,
          e.calculation?.runId,
          e.calculation?.resultId,
        ]
          .map(escape)
          .join(','),
      );
    }

    return {
      filename: `ghg-reconciliation-${params.reportingYear ?? 'all'}.csv`,
      csv: lines.join('\r\n'),
    };
  }
}