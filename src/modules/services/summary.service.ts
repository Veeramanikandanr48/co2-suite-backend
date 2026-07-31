import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from 'src/entities/service.entity';
import { OrganizationService } from 'src/entities/organization-service.entity';
import { ServiceScopeItem } from 'src/entities/service-scope-item.entity';
import { InventoryEntry } from 'src/entities/inventory-entry.entity';
import { Facility } from 'src/entities/facility.entity';
import { Organization } from 'src/entities/organization.entity';
import { UserDetails } from 'src/entities/user.entity';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';

@Injectable()
export class SummaryService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    @InjectRepository(OrganizationService)
    private readonly orgServiceRepo: Repository<OrganizationService>,
    @InjectRepository(ServiceScopeItem)
    private readonly scopeItemRepo: Repository<ServiceScopeItem>,
    @InjectRepository(InventoryEntry)
    private readonly inventoryRepo: Repository<InventoryEntry>,
    @InjectRepository(Facility)
    private readonly facilityRepo: Repository<Facility>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(UserDetails)
    private readonly userRepo: Repository<UserDetails>,
  ) {}

  /**
   * Calculate dynamic Carbon Summary metrics, graphs, charts, and activities strictly from DB data.
   */
  async getCarbonSummary(
    userOrOrgId: IDecodeUserDetails | number,
    serviceCode: string,
    queryParams?: { year?: string; facility?: string },
  ) {
    const orgId =
      typeof userOrOrgId === 'object'
        ? userOrOrgId.organizationId || 1
        : userOrOrgId;
    const codeUpper = (serviceCode || 'CARBON').trim().toUpperCase();

    // 1. Fetch available facilities for this org from DB
    const dbFacilities = await this.facilityRepo
      .createQueryBuilder('facility')
      .select([
        'facility.id',
        'facility.organizationId',
        'facility.name',
        'facility.isActive',
      ])
      .where('facility.organizationId = :orgId', { orgId })
      .andWhere('facility.isActive = :isActive', { isActive: true })
      .orderBy('facility.name', 'ASC')
      .getMany();
    const facilityList = dbFacilities.map((f) => f.name);

    // 2. Fetch all inventory entries for this org & service code from DB
    const allEntries = await this.inventoryRepo
      .createQueryBuilder('entry')
      .select([
        'entry.id',
        'entry.organizationId',
        'entry.serviceCode',
        'entry.category',
        'entry.name',
        'entry.amount',
        'entry.unit',
        'entry.ef',
        'entry.efSource',
        'entry.dateFrom',
        'entry.dateTo',
        'entry.facility',
        'entry.emission',
        'entry.status',
        'entry.approvalStatus',
        'entry.createdAt',
      ])
      .where('entry.organizationId = :orgId', { orgId })
      .andWhere('entry.serviceCode = :codeUpper', { codeUpper })
      .andWhere('entry.isActive = :isActive', { isActive: true })
      .orderBy('entry.id', 'DESC')
      .getMany();

    // Include any additional facilities found in inventory entries
    allEntries.forEach((e) => {
      if (e.facility && !facilityList.includes(e.facility)) {
        facilityList.push(e.facility);
      }
    });

    // 3. Extract all available years from DB records
    const availableYearsSet = new Set<string>();
    allEntries.forEach((e) => {
      const yearFromDate = e.dateFrom
        ? e.dateFrom.split('.').pop() || e.dateFrom.split('-')[0]
        : null;
      if (yearFromDate && yearFromDate.length === 4) {
        availableYearsSet.add(yearFromDate);
      } else if (e.createdAt) {
        availableYearsSet.add(new Date(e.createdAt).getFullYear().toString());
      }
    });
    if (availableYearsSet.size === 0) {
      availableYearsSet.add(new Date().getFullYear().toString());
    }
    const availableYears = Array.from(availableYearsSet).sort(
      (a, b) => Number(b) - Number(a),
    );

    // 4. Fetch service scope items from DB
    const scopeItems = await this.scopeItemRepo
      .createQueryBuilder('scopeItem')
      .select([
        'scopeItem.id',
        'scopeItem.serviceCode',
        'scopeItem.category',
        'scopeItem.code',
        'scopeItem.scopeCode',
        'scopeItem.name',
        'scopeItem.unit',
        'scopeItem.isActive',
      ])
      .where('scopeItem.serviceCode = :codeUpper', { codeUpper })
      .andWhere('scopeItem.isActive = :isActive', { isActive: true })
      .orderBy('scopeItem.scopeCode', 'ASC')
      .addOrderBy('scopeItem.sortOrder', 'ASC')
      .getMany();

    const categoryToScopeMap = new Map<string, string>();
    const scope1CategoriesSet = new Set<string>();
    const scope2CategoriesSet = new Set<string>();
    const scope3CategoriesSet = new Set<string>();

    scopeItems.forEach((item) => {
      categoryToScopeMap.set(item.name.toLowerCase(), item.scope);
      if (item.scope === 'Scope 1')
        scope1CategoriesSet.add(item.name.toLowerCase());
      if (item.scope === 'Scope 2')
        scope2CategoriesSet.add(item.name.toLowerCase());
      if (item.scope === 'Scope 3')
        scope3CategoriesSet.add(item.name.toLowerCase());
    });

    // 5. Filter entries based on queryParams
    let filteredEntries = allEntries;
    if (
      queryParams?.facility &&
      queryParams.facility !== 'all' &&
      queryParams.facility !== 'All Facilities'
    ) {
      const selectedFac = queryParams.facility.toLowerCase().trim();
      filteredEntries = filteredEntries.filter(
        (e) => (e.facility || '').toLowerCase().trim() === selectedFac,
      );
    }

    if (
      queryParams?.year &&
      queryParams.year !== 'all' &&
      queryParams.year !== 'All Years'
    ) {
      const selectedYr = queryParams.year.trim();
      filteredEntries = filteredEntries.filter((e) => {
        const entryYear = e.dateFrom
          ? e.dateFrom.split('.').pop() || e.dateFrom.split('-')[0]
          : e.createdAt
            ? new Date(e.createdAt).getFullYear().toString()
            : '';
        return entryYear === selectedYr;
      });
    }

    // 6. Calculate KPIs & Chart data from DB filtered entries
    let totalEmissions = 0;
    let scope1Emissions = 0;
    let scope2Emissions = 0;
    let scope3Emissions = 0;

    const recordedScope1Categories = new Set<string>();
    const recordedScope2Categories = new Set<string>();
    const recordedScope3Categories = new Set<string>();

    const categoryAggregationMap = new Map<
      string,
      { category: string; scope: string; emission: number; count: number }
    >();
    const facilityAggregationMap = new Map<
      string,
      { facility: string; emission: number; count: number }
    >();
    const monthlyAggregationMap = new Map<
      string,
      {
        period: string;
        scope1: number;
        scope2: number;
        scope3: number;
        total: number;
      }
    >();

    filteredEntries.forEach((entry) => {
      const em = entry.emission || 0;
      totalEmissions += em;

      const catLower = (entry.category || '').toLowerCase();
      let scopeName = categoryToScopeMap.get(catLower);
      if (!scopeName) {
        if (
          catLower.includes('purchased electricity') ||
          catLower.includes('heating')
        ) {
          scopeName = 'Scope 2';
        } else if (
          catLower.includes('goods') ||
          catLower.includes('capital') ||
          catLower.includes('travel') ||
          catLower.includes('commuting') ||
          catLower.includes('transportation') ||
          catLower.includes('waste') ||
          catLower.includes('sold')
        ) {
          scopeName = 'Scope 3';
        } else {
          scopeName = 'Scope 1';
        }
      }

      if (scopeName === 'Scope 1') {
        scope1Emissions += em;
        recordedScope1Categories.add(catLower);
      } else if (scopeName === 'Scope 2') {
        scope2Emissions += em;
        recordedScope2Categories.add(catLower);
      } else {
        scope3Emissions += em;
        recordedScope3Categories.add(catLower);
      }

      // Aggregate by category
      const existingCat = categoryAggregationMap.get(
        entry.category || 'Other',
      ) || {
        category: entry.category || 'Other',
        scope: scopeName,
        emission: 0,
        count: 0,
      };
      existingCat.emission += em;
      existingCat.count += 1;
      categoryAggregationMap.set(entry.category || 'Other', existingCat);

      // Aggregate by facility
      const facName = entry.facility || 'Unassigned Facility';
      const existingFac = facilityAggregationMap.get(facName) || {
        facility: facName,
        emission: 0,
        count: 0,
      };
      existingFac.emission += em;
      existingFac.count += 1;
      facilityAggregationMap.set(facName, existingFac);

      // Aggregate by month/period
      let monthLabel = 'Recent';
      if (entry.dateFrom) {
        const parts = entry.dateFrom.split('.');
        if (parts.length === 3) {
          const monthIndex = parseInt(parts[1], 10) - 1;
          const monthNames = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
          ];
          if (monthIndex >= 0 && monthIndex < 12) {
            monthLabel = `${monthNames[monthIndex]} ${parts[2]}`;
          }
        }
      } else if (entry.createdAt) {
        const d = new Date(entry.createdAt);
        const monthNames = [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ];
        monthLabel = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      }

      const existingMonth = monthlyAggregationMap.get(monthLabel) || {
        period: monthLabel,
        scope1: 0,
        scope2: 0,
        scope3: 0,
        total: 0,
      };
      if (scopeName === 'Scope 1') existingMonth.scope1 += em;
      else if (scopeName === 'Scope 2') existingMonth.scope2 += em;
      else existingMonth.scope3 += em;
      existingMonth.total += em;
      monthlyAggregationMap.set(monthLabel, existingMonth);
    });

    totalEmissions = Number(totalEmissions.toFixed(2));
    scope1Emissions = Number(scope1Emissions.toFixed(2));
    scope2Emissions = Number(scope2Emissions.toFixed(2));
    scope3Emissions = Number(scope3Emissions.toFixed(2));

    const scope1Percentage =
      totalEmissions > 0
        ? Number(((scope1Emissions / totalEmissions) * 100).toFixed(1))
        : 0;
    const scope2Percentage =
      totalEmissions > 0
        ? Number(((scope2Emissions / totalEmissions) * 100).toFixed(1))
        : 0;
    const scope3Percentage =
      totalEmissions > 0
        ? Number(((scope3Emissions / totalEmissions) * 100).toFixed(1))
        : 0;

    const emissionsByCategory = Array.from(categoryAggregationMap.values())
      .map((cat) => ({
        ...cat,
        emission: Number(cat.emission.toFixed(2)),
        percentage:
          totalEmissions > 0
            ? Number(((cat.emission / totalEmissions) * 100).toFixed(1))
            : 0,
      }))
      .sort((a, b) => b.emission - a.emission);

    const emissionsByFacility = Array.from(facilityAggregationMap.values())
      .map((fac) => ({
        ...fac,
        emission: Number(fac.emission.toFixed(2)),
        percentage:
          totalEmissions > 0
            ? Number(((fac.emission / totalEmissions) * 100).toFixed(1))
            : 0,
      }))
      .sort((a, b) => b.emission - a.emission);

    const emissionsTrend = Array.from(monthlyAggregationMap.values()).map(
      (m) => ({
        period: m.period,
        scope1: Number(m.scope1.toFixed(2)),
        scope2: Number(m.scope2.toFixed(2)),
        scope3: Number(m.scope3.toFixed(2)),
        total: Number(m.total.toFixed(2)),
      }),
    );

    const latestActivities = filteredEntries.slice(0, 10).map((entry) => ({
      id: entry.id,
      name: entry.name,
      category: entry.category,
      facility: entry.facility || 'Unassigned',
      amount: entry.amount,
      unit: entry.unit,
      ef: entry.ef,
      efSource: entry.efSource,
      emission: entry.emission,
      status: entry.status || 'Approved',
      dateFrom: entry.dateFrom,
      dateTo: entry.dateTo,
      createdAt: entry.createdAt,
    }));

    return {
      serviceCode: codeUpper,
      unit: 'tonne CO₂-e',
      availableYears,
      availableFacilities: ['All Facilities', ...facilityList],
      totalEntries: filteredEntries.length,
      kpis: {
        totalEmissions,
        scope1Emissions,
        scope1Percentage,
        scope1CategoryCount: {
          recorded: recordedScope1Categories.size,
          total: Math.max(
            scope1CategoriesSet.size,
            recordedScope1Categories.size,
            4,
          ),
        },
        scope2Emissions,
        scope2Percentage,
        scope2CategoryCount: {
          recorded: recordedScope2Categories.size,
          total: Math.max(
            scope2CategoriesSet.size,
            recordedScope2Categories.size,
            2,
          ),
        },
        scope3Emissions,
        scope3Percentage,
        scope3CategoryCount: {
          recorded: recordedScope3Categories.size,
          total: Math.max(
            scope3CategoriesSet.size,
            recordedScope3Categories.size,
            13,
          ),
        },
      },
      emissionsByCategory,
      emissionsByFacility,
      emissionsTrend,
      latestActivities,
    };
  }

  /**
   * Calculate overall Executive Main Dashboard summary metrics, active services, graphs, and activity stream from DB.
   * Differentiates Super Admin (Role 1) platform view from Org Admin/User (Role 2/3) tenant view.
   */
  async getExecutiveDashboardSummary(
    userOrRoleId: IDecodeUserDetails | number,
    queryParamsOrOrgId?: { year?: string; facility?: string } | number,
    queryParams?: { year?: string; facility?: string },
  ) {
    let userRoleId = 1;
    let orgId = 1;

    if (typeof userOrRoleId === 'object') {
      userRoleId = userOrRoleId.roleId;
      orgId = userOrRoleId.organizationId || 1;
    } else {
      userRoleId = userOrRoleId;
      orgId = typeof queryParamsOrOrgId === 'number' ? queryParamsOrOrgId : 1;
    }
    const isSuperAdmin = Number(userRoleId) === 1;

    // 1. Fetch Master Services
    const allMasterServices = await this.serviceRepo
      .createQueryBuilder('service')
      .select([
        'service.id',
        'service.name',
        'service.code',
        'service.description',
        'service.isActive',
      ])
      .where('service.isActive = :isActive', { isActive: true })
      .orderBy('service.id', 'ASC')
      .getMany();

    const serviceConfigMap: Record<
      string,
      { daysLeft: number; demoUrl: string }
    > = {
      CARBON: { daysLeft: 2863, demoUrl: '/services/carbon' },
      CBAM: { daysLeft: 1420, demoUrl: '/services/cbam' },
      PEF_TEXTILES: { daysLeft: 980, demoUrl: '/services/pef_textiles' },
      LCA_PLASTICS: { daysLeft: 1840, demoUrl: '/services/lca_plastics' },
      LCA_METALS: { daysLeft: 2100, demoUrl: '/services/lca_metals' },
      ESG: { daysLeft: 3120, demoUrl: '/services/esg' },
      EPD_CABLES: { daysLeft: 1650, demoUrl: '/services/epd_cables' },
    };

    if (isSuperAdmin) {
      // ─── SUPER ADMIN PLATFORM GOVERNANCE DASHBOARD DATA ───────────────────
      const allOrgs = await this.orgRepo
        .createQueryBuilder('org')
        .select([
          'org.id',
          'org.name',
          'org.code',
          'org.contactEmail',
          'org.isActive',
        ])
        .where('org.isActive = :isActive', { isActive: true })
        .orderBy('org.id', 'ASC')
        .getMany();

      const totalUsersCount = await this.userRepo
        .createQueryBuilder('user')
        .where('user.isActive = :isActive', { isActive: true })
        .getCount();

      const allFacilities = await this.facilityRepo
        .createQueryBuilder('facility')
        .select([
          'facility.id',
          'facility.organizationId',
          'facility.name',
          'facility.isActive',
        ])
        .where('facility.isActive = :isActive', { isActive: true })
        .getMany();

      const allOrgServices = await this.orgServiceRepo
        .createQueryBuilder('orgService')
        .leftJoinAndSelect('orgService.service', 'service')
        .select([
          'orgService.id',
          'orgService.organizationId',
          'orgService.serviceId',
          'orgService.isActive',
          'service.id',
          'service.name',
          'service.code',
          'service.isActive',
        ])
        .where('orgService.isActive = :isActive', { isActive: true })
        .getMany();

      const allEntries = await this.inventoryRepo
        .createQueryBuilder('entry')
        .select([
          'entry.id',
          'entry.organizationId',
          'entry.serviceCode',
          'entry.category',
          'entry.name',
          'entry.amount',
          'entry.unit',
          'entry.ef',
          'entry.efSource',
          'entry.dateFrom',
          'entry.dateTo',
          'entry.facility',
          'entry.emission',
          'entry.status',
          'entry.approvalStatus',
          'entry.createdAt',
        ])
        .andWhere('entry.isActive = :isActive', { isActive: true })
        .orderBy('entry.id', 'DESC')
        .getMany();

      // Map organization id to org details
      const orgMap = new Map<number, Organization>();
      allOrgs.forEach((o) => orgMap.set(o.id, o));

      // Calculate portfolio metrics & facility details per organization
      const orgSummaryList = await Promise.all(
        allOrgs.map(async (org) => {
          const orgFacs = allFacilities.filter(
            (f) => f.organizationId === org.id,
          );
          const orgSvcs = allOrgServices.filter(
            (s) => s.organizationId === org.id,
          );
          const orgEntries = allEntries.filter(
            (e) => e.organizationId === org.id,
          );
          const orgTotalEmissions = Number(
            orgEntries
              .reduce((sum, e) => sum + (e.emission || 0), 0)
              .toFixed(2),
          );

          const orgFacDetails = orgFacs.map((f) => {
            const facEntries = orgEntries.filter(
              (e) => (e.facility || '').toLowerCase() === f.name.toLowerCase(),
            );
            const facEmissions = Number(
              facEntries
                .reduce((sum, e) => sum + (e.emission || 0), 0)
                .toFixed(2),
            );
            return {
              id: f.id,
              name: f.name,
              address: f.address || 'Facility Site Location',
              countryCode: f.countryCode || 'UK',
              postCode: f.postCode || 'N/A',
              unLocode: f.unLocode || 'N/A',
              totalEmissions: facEmissions,
              entriesCount: facEntries.length,
            };
          });

          return {
            id: org.id,
            name: org.name,
            code: org.code,
            contactEmail: org.contactEmail || 'N/A',
            industry: org.industry || 'Enterprise Sustainability',
            facilitiesCount: orgFacs.length,
            subscribedServicesCount: orgSvcs.length || allMasterServices.length,
            totalEmissions: orgTotalEmissions,
            entriesCount: orgEntries.length,
            facilities: orgFacDetails,
          };
        }),
      );

      // Global platform KPIs
      let globalEmissions = 0;
      let scope1Emissions = 0;
      let scope2Emissions = 0;
      let scope3Emissions = 0;

      const monthlyMap = new Map<
        string,
        {
          period: string;
          scope1: number;
          scope2: number;
          scope3: number;
          total: number;
        }
      >();
      const categoryMap = new Map<
        string,
        { category: string; scope: string; emission: number; count: number }
      >();

      allEntries.forEach((entry) => {
        const em = entry.emission || 0;
        globalEmissions += em;

        const catLower = (entry.category || '').toLowerCase();
        let scopeName = 'Scope 1';
        if (
          catLower.includes('purchased electricity') ||
          catLower.includes('heating')
        )
          scopeName = 'Scope 2';
        else if (
          catLower.includes('goods') ||
          catLower.includes('capital') ||
          catLower.includes('travel') ||
          catLower.includes('commuting') ||
          catLower.includes('transportation') ||
          catLower.includes('waste') ||
          catLower.includes('sold')
        )
          scopeName = 'Scope 3';

        if (scopeName === 'Scope 1') scope1Emissions += em;
        else if (scopeName === 'Scope 2') scope2Emissions += em;
        else scope3Emissions += em;

        const existingCat = categoryMap.get(entry.category || 'Other') || {
          category: entry.category || 'Other',
          scope: scopeName,
          emission: 0,
          count: 0,
        };
        existingCat.emission += em;
        existingCat.count += 1;
        categoryMap.set(entry.category || 'Other', existingCat);

        let monthLabel = 'Recent';
        if (entry.dateFrom) {
          const parts = entry.dateFrom.split('.');
          if (parts.length === 3) {
            const monthNames = [
              'Jan',
              'Feb',
              'Mar',
              'Apr',
              'May',
              'Jun',
              'Jul',
              'Aug',
              'Sep',
              'Oct',
              'Nov',
              'Dec',
            ];
            const mIdx = parseInt(parts[1], 10) - 1;
            if (mIdx >= 0 && mIdx < 12)
              monthLabel = `${monthNames[mIdx]} ${parts[2]}`;
          }
        }
        const existingMonth = monthlyMap.get(monthLabel) || {
          period: monthLabel,
          scope1: 0,
          scope2: 0,
          scope3: 0,
          total: 0,
        };
        if (scopeName === 'Scope 1') existingMonth.scope1 += em;
        else if (scopeName === 'Scope 2') existingMonth.scope2 += em;
        else existingMonth.scope3 += em;
        existingMonth.total += em;
        monthlyMap.set(monthLabel, existingMonth);
      });

      globalEmissions = Number(globalEmissions.toFixed(2));
      scope1Emissions = Number(scope1Emissions.toFixed(2));
      scope2Emissions = Number(scope2Emissions.toFixed(2));
      scope3Emissions = Number(scope3Emissions.toFixed(2));

      const recentActivities = allEntries.slice(0, 10).map((e) => {
        const org = orgMap.get(e.organizationId);
        return {
          id: e.id,
          orgName: org?.name || `Org #${e.organizationId}`,
          name: e.name,
          serviceCode: e.serviceCode,
          category: e.category,
          facility: e.facility || 'Unassigned',
          amount: e.amount,
          unit: e.unit,
          emission: e.emission,
          status: e.status || 'Approved',
          createdAt: e.createdAt,
        };
      });

      const subscribedServices = allMasterServices.map((svc) => {
        const codeUpper = svc.code.toUpperCase();
        const cfg = serviceConfigMap[codeUpper] || {
          daysLeft: 2800,
          demoUrl: `/services/${svc.code.toLowerCase()}`,
        };
        const totalSvcEmissions = Number(
          allEntries
            .filter(
              (e) => (e.serviceCode || 'CARBON').toUpperCase() === codeUpper,
            )
            .reduce((sum, e) => sum + (e.emission || 0), 0)
            .toFixed(2),
        );
        const subCount =
          allOrgServices.filter(
            (s) => s.service?.code?.toUpperCase() === codeUpper,
          ).length || allOrgs.length;

        return {
          id: svc.id,
          code: svc.code,
          name: svc.name,
          category: svc.category,
          description: svc.description,
          demoUrl: svc.demoUrl || cfg.demoUrl,
          daysLeft: cfg.daysLeft,
          isSubscribed: true,
          totalEmissions: totalSvcEmissions,
          subscriberCount: subCount,
          entriesCount: allEntries.filter(
            (e) => (e.serviceCode || 'CARBON').toUpperCase() === codeUpper,
          ).length,
        };
      });

      return {
        isSuperAdmin: true,
        unit: 'tonne CO₂-e',
        availableYears: ['2026', '2025', '2024'],
        availableFacilities: [
          'All Facilities',
          ...allFacilities.map((f) => f.name),
        ],
        kpis: {
          totalEmissions: globalEmissions,
          scope1Emissions,
          scope1Percentage:
            globalEmissions > 0
              ? Number(((scope1Emissions / globalEmissions) * 100).toFixed(1))
              : 0,
          scope2Emissions,
          scope2Percentage:
            globalEmissions > 0
              ? Number(((scope2Emissions / globalEmissions) * 100).toFixed(1))
              : 0,
          scope3Emissions,
          scope3Percentage:
            globalEmissions > 0
              ? Number(((scope3Emissions / globalEmissions) * 100).toFixed(1))
              : 0,
          totalOrganizations: allOrgs.length,
          totalUsers: totalUsersCount,
          totalInventoryEntries: allEntries.length,
          activeServicesCount: allMasterServices.length,
          facilitiesCount: allFacilities.length,
          dataCompletenessPercent: 100,
        },
        organizationsSummary: orgSummaryList,
        subscribedServices,
        emissionsByCategory: Array.from(categoryMap.values()).map((c) => ({
          ...c,
          emission: Number(c.emission.toFixed(2)),
          percentage:
            globalEmissions > 0
              ? Number(((c.emission / globalEmissions) * 100).toFixed(1))
              : 0,
        })),
        emissionsTrend: Array.from(monthlyMap.values()).map((m) => ({
          period: m.period,
          scope1: Number(m.scope1.toFixed(2)),
          scope2: Number(m.scope2.toFixed(2)),
          scope3: Number(m.scope3.toFixed(2)),
          total: Number(m.total.toFixed(2)),
        })),
        recentActivities,
      };
    }

    // ─── ORGANIZATION ADMIN & USER SUSTAINABILITY DASHBOARD DATA ─────────
    const dbFacilities = await this.facilityRepo
      .createQueryBuilder('facility')
      .select([
        'facility.id',
        'facility.organizationId',
        'facility.name',
        'facility.isActive',
      ])
      .where('facility.organizationId = :orgId', { orgId })
      .andWhere('facility.isActive = :isActive', { isActive: true })
      .orderBy('facility.name', 'ASC')
      .getMany();
    const facilityList = dbFacilities.map((f) => f.name);

    const orgServices = await this.orgServiceRepo
      .createQueryBuilder('orgService')
      .leftJoinAndSelect('orgService.service', 'service')
      .select([
        'orgService.id',
        'orgService.organizationId',
        'orgService.serviceId',
        'orgService.isActive',
        'service.id',
        'service.name',
        'service.code',
        'service.isActive',
      ])
      .where('orgService.organizationId = :orgId', { orgId })
      .andWhere('orgService.isActive = :isActive', { isActive: true })
      .getMany();

    const assignedServiceCodes = new Set<string>();
    orgServices.forEach((os) => {
      if (os.service?.code) {
        assignedServiceCodes.add(os.service.code.toUpperCase());
      }
    });
    if (assignedServiceCodes.size === 0) {
      allMasterServices.forEach((s) =>
        assignedServiceCodes.add(s.code.toUpperCase()),
      );
    }

    const allEntries = await this.inventoryRepo
      .createQueryBuilder('entry')
      .select([
        'entry.id',
        'entry.organizationId',
        'entry.serviceCode',
        'entry.category',
        'entry.name',
        'entry.amount',
        'entry.unit',
        'entry.ef',
        'entry.efSource',
        'entry.dateFrom',
        'entry.dateTo',
        'entry.facility',
        'entry.emission',
        'entry.status',
        'entry.approvalStatus',
        'entry.createdAt',
      ])
      .where('entry.organizationId = :orgId', { orgId })
      .andWhere('entry.isActive = :isActive', { isActive: true })
      .orderBy('entry.id', 'DESC')
      .getMany();

    allEntries.forEach((e) => {
      if (e.facility && !facilityList.includes(e.facility)) {
        facilityList.push(e.facility);
      }
    });

    const availableYearsSet = new Set<string>();
    allEntries.forEach((e) => {
      const yearFromDate = e.dateFrom
        ? e.dateFrom.split('.').pop() || e.dateFrom.split('-')[0]
        : null;
      if (yearFromDate && yearFromDate.length === 4) {
        availableYearsSet.add(yearFromDate);
      } else if (e.createdAt) {
        availableYearsSet.add(new Date(e.createdAt).getFullYear().toString());
      }
    });
    if (availableYearsSet.size === 0) {
      availableYearsSet.add(new Date().getFullYear().toString());
    }
    const availableYears = Array.from(availableYearsSet).sort(
      (a, b) => Number(b) - Number(a),
    );

    let filteredEntries = allEntries;
    if (
      queryParams?.facility &&
      queryParams.facility !== 'all' &&
      queryParams.facility !== 'All Facilities'
    ) {
      const selectedFac = queryParams.facility.toLowerCase().trim();
      filteredEntries = filteredEntries.filter(
        (e) => (e.facility || '').toLowerCase().trim() === selectedFac,
      );
    }

    if (
      queryParams?.year &&
      queryParams.year !== 'all' &&
      queryParams.year !== 'All Years'
    ) {
      const selectedYr = queryParams.year.trim();
      filteredEntries = filteredEntries.filter((e) => {
        const entryYear = e.dateFrom
          ? e.dateFrom.split('.').pop() || e.dateFrom.split('-')[0]
          : e.createdAt
            ? new Date(e.createdAt).getFullYear().toString()
            : '';
        return entryYear === selectedYr;
      });
    }

    let totalEmissions = 0;
    let scope1Emissions = 0;
    let scope2Emissions = 0;
    let scope3Emissions = 0;

    const serviceEmissionsMap = new Map<
      string,
      { totalEmissions: number; count: number }
    >();
    const categoryAggregationMap = new Map<
      string,
      { category: string; scope: string; emission: number; count: number }
    >();
    const facilityAggregationMap = new Map<
      string,
      { facility: string; emission: number; count: number }
    >();
    const monthlyAggregationMap = new Map<
      string,
      {
        period: string;
        scope1: number;
        scope2: number;
        scope3: number;
        total: number;
      }
    >();

    filteredEntries.forEach((entry) => {
      const em = entry.emission || 0;
      totalEmissions += em;

      const sCode = (entry.serviceCode || 'CARBON').toUpperCase();
      const existingSvc = serviceEmissionsMap.get(sCode) || {
        totalEmissions: 0,
        count: 0,
      };
      existingSvc.totalEmissions += em;
      existingSvc.count += 1;
      serviceEmissionsMap.set(sCode, existingSvc);

      const catLower = (entry.category || '').toLowerCase();
      let scopeName = 'Scope 1';
      if (
        catLower.includes('purchased electricity') ||
        catLower.includes('heating')
      )
        scopeName = 'Scope 2';
      else if (
        catLower.includes('goods') ||
        catLower.includes('capital') ||
        catLower.includes('travel') ||
        catLower.includes('commuting') ||
        catLower.includes('transportation') ||
        catLower.includes('waste') ||
        catLower.includes('sold')
      )
        scopeName = 'Scope 3';

      if (scopeName === 'Scope 1') scope1Emissions += em;
      else if (scopeName === 'Scope 2') scope2Emissions += em;
      else scope3Emissions += em;

      const existingCat = categoryAggregationMap.get(
        entry.category || 'Other',
      ) || {
        category: entry.category || 'Other',
        scope: scopeName,
        emission: 0,
        count: 0,
      };
      existingCat.emission += em;
      existingCat.count += 1;
      categoryAggregationMap.set(entry.category || 'Other', existingCat);

      const facName = entry.facility || 'Unassigned Facility';
      const existingFac = facilityAggregationMap.get(facName) || {
        facility: facName,
        emission: 0,
        count: 0,
      };
      existingFac.emission += em;
      existingFac.count += 1;
      facilityAggregationMap.set(facName, existingFac);

      let monthLabel = 'Recent';
      if (entry.dateFrom) {
        const parts = entry.dateFrom.split('.');
        if (parts.length === 3) {
          const monthIndex = parseInt(parts[1], 10) - 1;
          const monthNames = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
          ];
          if (monthIndex >= 0 && monthIndex < 12)
            monthLabel = `${monthNames[monthIndex]} ${parts[2]}`;
        }
      } else if (entry.createdAt) {
        const d = new Date(entry.createdAt);
        const monthNames = [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ];
        monthLabel = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      }

      const existingMonth = monthlyAggregationMap.get(monthLabel) || {
        period: monthLabel,
        scope1: 0,
        scope2: 0,
        scope3: 0,
        total: 0,
      };
      if (scopeName === 'Scope 1') existingMonth.scope1 += em;
      else if (scopeName === 'Scope 2') existingMonth.scope2 += em;
      else existingMonth.scope3 += em;
      existingMonth.total += em;
      monthlyAggregationMap.set(monthLabel, existingMonth);
    });

    totalEmissions = Number(totalEmissions.toFixed(2));
    scope1Emissions = Number(scope1Emissions.toFixed(2));
    scope2Emissions = Number(scope2Emissions.toFixed(2));
    scope3Emissions = Number(scope3Emissions.toFixed(2));

    const orgFacDetails = dbFacilities.map((f) => {
      const facEntries = allEntries.filter(
        (e) => (e.facility || '').toLowerCase() === f.name.toLowerCase(),
      );
      const facEmissions = Number(
        facEntries.reduce((sum, e) => sum + (e.emission || 0), 0).toFixed(2),
      );
      return {
        id: f.id,
        name: f.name,
        address: f.address || 'Facility Installation Address',
        countryCode: f.countryCode || 'UK',
        postCode: f.postCode || 'N/A',
        unLocode: f.unLocode || 'N/A',
        totalEmissions: facEmissions,
        entriesCount: facEntries.length,
      };
    });

    const subscribedServices = allMasterServices.map((svc) => {
      const codeUpper = svc.code.toUpperCase();
      const isSubscribed = assignedServiceCodes.has(codeUpper);
      const aggData = serviceEmissionsMap.get(codeUpper) || {
        totalEmissions: 0,
        count: 0,
      };
      const cfg = serviceConfigMap[codeUpper] || {
        daysLeft: 2800,
        demoUrl: `/services/${svc.code.toLowerCase()}`,
      };

      return {
        id: svc.id,
        code: svc.code,
        name: svc.name,
        category: svc.category,
        description: svc.description,
        demoUrl: svc.demoUrl || cfg.demoUrl,
        daysLeft: cfg.daysLeft,
        isSubscribed,
        totalEmissions: Number(aggData.totalEmissions.toFixed(2)),
        entriesCount: aggData.count,
      };
    });

    const emissionsByCategory = Array.from(categoryAggregationMap.values())
      .map((cat) => ({
        ...cat,
        emission: Number(cat.emission.toFixed(2)),
        percentage:
          totalEmissions > 0
            ? Number(((cat.emission / totalEmissions) * 100).toFixed(1))
            : 0,
      }))
      .sort((a, b) => b.emission - a.emission);

    const emissionsByFacility = Array.from(facilityAggregationMap.values())
      .map((fac) => ({
        ...fac,
        emission: Number(fac.emission.toFixed(2)),
        percentage:
          totalEmissions > 0
            ? Number(((fac.emission / totalEmissions) * 100).toFixed(1))
            : 0,
      }))
      .sort((a, b) => b.emission - a.emission);

    const emissionsTrend = Array.from(monthlyAggregationMap.values()).map(
      (m) => ({
        period: m.period,
        scope1: Number(m.scope1.toFixed(2)),
        scope2: Number(m.scope2.toFixed(2)),
        scope3: Number(m.scope3.toFixed(2)),
        total: Number(m.total.toFixed(2)),
      }),
    );

    const recentActivities = filteredEntries.slice(0, 8).map((e) => ({
      id: e.id,
      name: e.name,
      serviceCode: e.serviceCode,
      category: e.category,
      facility: e.facility || 'Unassigned',
      amount: e.amount,
      unit: e.unit,
      emission: e.emission,
      status: e.status || 'Approved',
      createdAt: e.createdAt,
    }));

    return {
      isSuperAdmin: false,
      unit: 'tonne CO₂-e',
      availableYears,
      availableFacilities: ['All Facilities', ...facilityList],
      kpis: {
        totalEmissions,
        scope1Emissions,
        scope1Percentage:
          totalEmissions > 0
            ? Number(((scope1Emissions / totalEmissions) * 100).toFixed(1))
            : 0,
        scope2Emissions,
        scope2Percentage:
          totalEmissions > 0
            ? Number(((scope2Emissions / totalEmissions) * 100).toFixed(1))
            : 0,
        scope3Emissions,
        scope3Percentage:
          totalEmissions > 0
            ? Number(((scope3Emissions / totalEmissions) * 100).toFixed(1))
            : 0,
        totalInventoryEntries: filteredEntries.length,
        activeServicesCount: assignedServiceCodes.size,
        facilitiesCount: facilityList.length,
        dataCompletenessPercent: filteredEntries.length > 0 ? 100 : 0,
      },
      facilities: orgFacDetails,
      subscribedServices,
      emissionsByCategory,
      emissionsByFacility,
      emissionsTrend,
      recentActivities,
    };
  }
}
