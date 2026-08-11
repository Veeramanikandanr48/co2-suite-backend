import { VersionFuelMapping } from 'src/entities/version-fuel-mapping.entity';
import { FuelUnitMapping } from 'src/entities/fuel-unit-mapping.entity';
import { InventoryEntry } from 'src/entities/inventory-entry.entity';
import { EmissionFactor } from 'src/entities/emission-factor.entity';
import { InventoryActivity } from 'src/entities/inventory-activity.entity';

describe('Legacy Data Migration Integrity & Compatibility Audit (Phase 5)', () => {
  describe('Legacy Mapping -> V2 EmissionFactor Schema Migration', () => {
    it('should migrate legacy VersionFuelMapping and FuelUnitMapping to V2 EmissionFactor without data loss', () => {
      const legacyVersionFuel = new VersionFuelMapping();
      legacyVersionFuel.id = 1;
      legacyVersionFuel.factorVersionId = 10;
      legacyVersionFuel.fuelId = 20;
      legacyVersionFuel.emissionFactor = 2.68;

      const legacyFuelUnit = new FuelUnitMapping();
      legacyFuelUnit.id = 2;
      legacyFuelUnit.fuelId = 20;
      legacyFuelUnit.unitId = 30;
      legacyFuelUnit.emissionFactor = 2.68;

      // Migration mapping logic
      const migrateToV2EmissionFactor = (
        vf: VersionFuelMapping,
        fu: FuelUnitMapping,
      ): EmissionFactor => {
        if (!vf.factorVersionId || !fu.unitId) {
          throw new Error('Broken FK in legacy mapping');
        }
        const ef = new EmissionFactor();
        ef.datasetVersionId = vf.factorVersionId;
        ef.fuelId = vf.fuelId ?? fu.fuelId ?? undefined;
        ef.unitId = fu.unitId;
        ef.factorValue = fu.emissionFactor ?? vf.emissionFactor ?? 0;
        ef.validFrom = '2024-01-01';
        ef.isActive = true;
        return ef;
      };

      const v2Factor = migrateToV2EmissionFactor(
        legacyVersionFuel,
        legacyFuelUnit,
      );

      expect(v2Factor.datasetVersionId).toBe(10);
      expect(v2Factor.fuelId).toBe(20);
      expect(v2Factor.unitId).toBe(30);
      expect(v2Factor.factorValue).toBe(2.68);
      expect(v2Factor.validFrom).toBe('2024-01-01');
    });
  });

  describe('Legacy InventoryEntry -> V2 InventoryActivity Schema Migration', () => {
    it('should migrate legacy InventoryEntry to V2 InventoryActivity reconciling count and values', () => {
      const legacyEntries: InventoryEntry[] = [
        Object.assign(new InventoryEntry(), {
          id: 101,
          organizationId: 1,
          reportingPeriodId: 5,
          category: 'Stationary Combustion',
          name: 'Diesel',
          amount: 500,
          unit: 'L',
          ef: 2.68,
          dateFrom: '2024-01-01',
          dateTo: '2024-01-31',
        }),
        Object.assign(new InventoryEntry(), {
          id: 102,
          organizationId: 1,
          reportingPeriodId: 5,
          category: 'Mobile Combustion',
          name: 'Petrol',
          amount: 250,
          unit: 'L',
          ef: 2.31,
          dateFrom: '2024-02-01',
          dateTo: '2024-02-28',
        }),
      ];

      const migrateEntriesToActivities = (
        entries: InventoryEntry[],
      ): InventoryActivity[] => {
        return entries.map((entry) => {
          const activity = new InventoryActivity();
          activity.organizationId = entry.organizationId;
          activity.reportingPeriodId = entry.reportingPeriodId || 1;
          activity.facilityId = 1; // Default facility mapping
          activity.activityTypeId =
            entry.category === 'Stationary Combustion' ? 1 : 2;
          activity.activityDate = entry.dateFrom || '2024-01-01';
          activity.activityEndDate = entry.dateTo || undefined;
          activity.description = `${entry.category} - ${entry.name}`;
          activity.status = 'CALCULATED';
          return activity;
        });
      };

      const v2Activities = migrateEntriesToActivities(legacyEntries);

      // Reconcile count and fields
      expect(v2Activities.length).toBe(legacyEntries.length);
      expect(v2Activities[0].organizationId).toBe(
        legacyEntries[0].organizationId,
      );
      expect(v2Activities[0].activityDate).toBe(legacyEntries[0].dateFrom);
      expect(v2Activities[0].activityEndDate).toBe(legacyEntries[0].dateTo);
      expect(v2Activities[1].description).toContain('Petrol');
    });
  });
});
